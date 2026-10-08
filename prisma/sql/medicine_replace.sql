-- =====================================================================
-- Replace the old `medicine` table with the medex `medicines` table.
--   1. give `medicines` an id primary key + audit columns
--   2. match every old medicine to a `medicines` row by name/strength/form
--      (old medicines with no match and used in a case history, or added
--       by a user, are copied into `medicines` so nothing is lost)
--   3. point prescription_item (case history medicines) at the new ids
--   4. drop `medicine`, rename `medicines` -> `medicine`
-- The match list is kept in table medicine_migration_map for review.
-- Safe to run again: it does nothing once `medicines` is gone.
-- Run BEFORE `prisma db push`:
--   npm run db:medicine
-- =====================================================================

DO $$
DECLARE
    pk_name text;
    pk_cols text;
BEGIN
    IF to_regclass('public.medicines') IS NULL THEN
        RAISE NOTICE 'medicines table not found (already migrated?) - nothing to do';
        RETURN;
    END IF;

    -- ---------- 1. shape `medicines` like the app expects ----------
    SELECT c.conname, string_agg(a.attname, ',')
      INTO pk_name, pk_cols
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
     WHERE c.conrelid = 'public.medicines'::regclass AND c.contype = 'p'
     GROUP BY c.conname;

    IF pk_name IS NOT NULL AND pk_cols <> 'id' THEN
        EXECUTE format('ALTER TABLE public.medicines DROP CONSTRAINT %I', pk_name);
        pk_name := NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'medicines' AND column_name = 'id') THEN
        ALTER TABLE public.medicines ADD COLUMN id SERIAL;
    END IF;
    IF pk_name IS NULL THEN
        ALTER TABLE public.medicines ADD CONSTRAINT medicines_pkey PRIMARY KEY (id);
    END IF;

    ALTER TABLE public.medicines
        ADD COLUMN IF NOT EXISTS created_by   VARCHAR(150),
        ADD COLUMN IF NOT EXISTS created_date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_by   VARCHAR(150),
        ADD COLUMN IF NOT EXISTS updated_date TIMESTAMP(3);

    -- column types the app's schema uses
    ALTER TABLE public.medicines
        ALTER COLUMN brand_id     TYPE INTEGER USING brand_id::integer,
        ALTER COLUMN brand_name   TYPE TEXT,
        ALTER COLUMN dosage_form  TYPE TEXT,
        ALTER COLUMN segment      TYPE TEXT,
        ALTER COLUMN strength     TYPE TEXT,
        ALTER COLUMN generic_name TYPE TEXT,
        ALTER COLUMN company      TYPE TEXT,
        ALTER COLUMN price_text   TYPE TEXT,
        ALTER COLUMN price_amount TYPE DECIMAL(12,2) USING price_amount::numeric(12,2),
        ALTER COLUMN url          TYPE TEXT,
        ALTER COLUMN scraped_at   TYPE TIMESTAMPTZ(6) USING scraped_at::timestamptz;
    ALTER TABLE public.medicines ALTER COLUMN brand_id DROP NOT NULL;
    UPDATE public.medicines SET brand_name = COALESCE(NULLIF(trim(generic_name), ''), 'Unnamed') WHERE brand_name IS NULL OR trim(brand_name) = '';
    ALTER TABLE public.medicines ALTER COLUMN brand_name SET NOT NULL;

    -- nothing more to map when the old table is already gone
    IF to_regclass('public.medicine') IS NULL THEN
        ALTER TABLE public.medicines RENAME TO medicine;
        RETURN;
    END IF;

    -- ---------- 2. match old medicines to new ones ----------
    DROP TABLE IF EXISTS public.medicine_migration_map;
    CREATE TABLE public.medicine_migration_map (
        old_id       INTEGER PRIMARY KEY,
        old_name     TEXT,
        old_strength TEXT,
        old_form     TEXT,
        used_in_cases INTEGER,
        new_id       INTEGER,
        new_name     TEXT,
        new_strength TEXT,
        new_form     TEXT,
        match_type   TEXT,
        migrated_at  TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
    );

    WITH old AS (
        SELECT m.id, m.name, m.strength, m.unit, m."dosageForm" AS form, m."createdBy" AS created_by,
               lower(regexp_replace(m.name, '[^a-zA-Z0-9]', '', 'g'))                                  AS n_full,
               lower(regexp_replace(regexp_replace(m.name, '\s*[0-9].*$', ''), '[^a-zA-Z0-9]', '', 'g')) AS n_core,
               -- strength number: from the strength column, else from the name ("Sefril 500")
               COALESCE(substring(m.strength FROM '[0-9]+(?:\.[0-9]+)?'),
                        substring(m.name     FROM '[0-9]+(?:\.[0-9]+)?'))                               AS n_str,
               lower(COALESCE(m."dosageForm", ''))                                                     AS n_form,
               (SELECT count(*) FROM public.prescription_item pi WHERE pi."medicineId" = m.id)         AS used
          FROM public.medicine m
    ),
    cand AS (
        SELECT o.id AS old_id, n.id AS new_id,
               CASE WHEN lower(regexp_replace(n.brand_name, '[^a-zA-Z0-9]', '', 'g')) = o.n_full THEN 2 ELSE 1 END AS s_name,
               CASE WHEN o.n_str IS NOT NULL AND substring(n.strength FROM '[0-9]+(?:\.[0-9]+)?') = o.n_str THEN 2 ELSE 0 END AS s_str,
               CASE WHEN o.n_form <> '' AND lower(COALESCE(n.dosage_form, '')) = o.n_form THEN 2
                    WHEN o.n_form <> '' AND lower(COALESCE(n.dosage_form, '')) LIKE '%' || o.n_form || '%' THEN 1
                    ELSE 0 END AS s_form
          FROM old o
          JOIN public.medicines n
            ON lower(regexp_replace(n.brand_name, '[^a-zA-Z0-9]', '', 'g')) IN (o.n_full, o.n_core)
           AND o.n_core <> ''
    ),
    best AS (
        -- the brand name must match AND strength or dosage form must agree
        SELECT DISTINCT ON (old_id) old_id, new_id, s_str, s_form
          FROM cand
         WHERE s_str > 0 OR s_form > 0
         ORDER BY old_id, s_name + s_str + s_form DESC, new_id
    )
    INSERT INTO public.medicine_migration_map
        (old_id, old_name, old_strength, old_form, used_in_cases, new_id, match_type)
    SELECT o.id, o.name, trim(COALESCE(o.strength, '') || ' ' || COALESCE(o.unit, '')), o.form, o.used,
           b.new_id,
           CASE WHEN b.new_id IS NULL THEN NULL
                WHEN b.s_str > 0 AND b.s_form > 0 THEN 'name + strength + form'
                WHEN b.s_str > 0 THEN 'name + strength'
                ELSE 'name + form' END
      FROM old o
      LEFT JOIN best b ON b.old_id = o.id;

    -- unmatched: copy into `medicines` when used in a case history or added by a user
    ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS tmp_old_id INTEGER;
    INSERT INTO public.medicines (brand_name, strength, dosage_form, segment, created_by, created_date, tmp_old_id)
    SELECT m.name,
           NULLIF(trim(COALESCE(m.strength, '') || ' ' || COALESCE(m.unit, '')), ''),
           m."dosageForm",
           m."manufacturerType",
           COALESCE(m."createdBy", 'migration'),
           m."createdDate",
           m.id
      FROM public.medicine m
      JOIN public.medicine_migration_map mm ON mm.old_id = m.id
     WHERE mm.new_id IS NULL
       AND (mm.used_in_cases > 0 OR COALESCE(m."createdBy", 'seed') <> 'seed');

    UPDATE public.medicine_migration_map mm
       SET new_id = n.id, match_type = 'copied (no match)'
      FROM public.medicines n
     WHERE n.tmp_old_id = mm.old_id;

    ALTER TABLE public.medicines DROP COLUMN tmp_old_id;

    UPDATE public.medicine_migration_map mm
       SET new_name = n.brand_name, new_strength = n.strength, new_form = n.dosage_form
      FROM public.medicines n
     WHERE n.id = mm.new_id;

    UPDATE public.medicine_migration_map SET match_type = 'not needed (unused seed row)' WHERE new_id IS NULL;

    -- ---------- 3. move case history medicines ----------
    ALTER TABLE public.prescription_item DROP CONSTRAINT IF EXISTS "prescription_item_medicineId_fkey";

    UPDATE public.prescription_item pi
       SET "medicineId" = mm.new_id
      FROM public.medicine_migration_map mm
     WHERE mm.old_id = pi."medicineId";

    -- ---------- 4. swap tables ----------
    DROP TABLE public.medicine;
    ALTER TABLE public.medicines RENAME TO medicine;
    ALTER TABLE public.medicine RENAME CONSTRAINT medicines_pkey TO medicine_pkey;
    IF to_regclass('public.medicines_id_seq') IS NOT NULL THEN
        ALTER SEQUENCE public.medicines_id_seq RENAME TO medicine_id_seq;
    END IF;

    ALTER TABLE public.prescription_item
        ADD CONSTRAINT "prescription_item_medicineId_fkey"
        FOREIGN KEY ("medicineId") REFERENCES public.medicine(id) ON DELETE RESTRICT ON UPDATE CASCADE;

    CREATE INDEX IF NOT EXISTS medicine_brand_name_idx   ON public.medicine (brand_name);
    CREATE INDEX IF NOT EXISTS medicine_generic_name_idx ON public.medicine (generic_name);
END $$;

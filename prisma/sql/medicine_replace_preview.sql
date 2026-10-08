-- Dry run of medicine_replace.sql: runs the migration inside a transaction,
-- shows how every medicine used in a case history will be moved, then rolls
-- everything back. Nothing is changed.
--   psql "<database url>" -f prisma/sql/medicine_replace_preview.sql
BEGIN;
\i prisma/sql/medicine_replace.sql
\echo ''
\echo '== Medicines used in case histories =='
SELECT old_id, old_name, old_strength, old_form, used_in_cases,
       new_id, new_name, new_strength, new_form, match_type
  FROM medicine_migration_map
 WHERE used_in_cases > 0
 ORDER BY used_in_cases DESC, old_name;
\echo '== Other old medicines =='
SELECT old_id, old_name, old_strength, old_form, new_name, new_strength, new_form, match_type
  FROM medicine_migration_map
 WHERE used_in_cases = 0
 ORDER BY old_name;
ROLLBACK;

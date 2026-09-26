"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, Input, Label, Button } from "@/components/ui";
import { Loader2, LogIn } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("admin@mohonto.com");
    const [password, setPassword] = useState("Admin@123");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // preload the dashboard bundle while the user types,
    // so the post-login navigation is instant
    useEffect(() => {
        router.prefetch("/dashboard");
    }, [router]);

    const submit = async (e: any) => {
        e.preventDefault();
        if (loading) return;
        setError("");
        setLoading(true);

        const r = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (r?.ok) {
            router.replace("/dashboard");
            // keep the loader spinning until the page actually changes
        } else {
            setError("Invalid email or password.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 p-4">
            <Card className="w-full max-w-md p-8">
                <div className="mb-8 text-center">
                    <div className="text-2xl font-bold text-teal-700">
                        Mohonto Dental Care
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        Sign in to clinic management
                    </p>
                </div>

                <form className="space-y-4" onSubmit={submit}>
                    <div>
                        <Label>Email</Label>

                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <Label>Password</Label>

                        <Input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <Button
                        className="w-full disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2
                                    size={16}
                                    className="mr-2 animate-spin"
                                />
                                Logging in...
                            </>
                        ) : (
                            <>
                                <LogIn size={16} className="mr-2" />
                                Sign in
                            </>
                        )}
                    </Button>
                </form>

                <p className="mt-5 text-center text-xs text-slate-400">
                    Demo: admin@mohonto.com / Admin@123
                </p>
            </Card>
        </div>
    );
}

"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Loader2, Eye, EyeOff, Mail, User, LogIn, TriangleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";

export function UserAuthForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const { signIn } = useAuthActions();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pending, setPending] = useState(false);

    const [loadingProvider, setLoadingProvider] = useState<"github" | "google" | null>(null);

    const router = useRouter();

    /*     const [state, setState] = useState<SignInFlow>("signIn");
     */

    const onPasswordSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPending(true);
        try {
            await signIn("password", { email, password, flow: "signIn" });
            toast.success("Welcome!");
        } catch (error) {
            toast.error("Invalid email or password");
        } finally {
            setPending(false);
        }
    };



    const handleProviderSignIn = (provider: "github" | "google") => {
        setLoadingProvider(provider);
        signIn(provider)
            .finally(() => {
                setLoadingProvider(null);
            });
    };
    return (
        <div
            className={cn(
                "grid gap-6 w-full sm:w-[120%] sm:-ml-[10%]",
                className
            )}
            {...props}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Log In with Email</CardTitle>
                    <CardDescription>
                        Securely log in using your email address. Make sure to provide a valid and accessible email.
                    </CardDescription>
                </CardHeader>

                <form
                    onSubmit={onPasswordSignIn}
                    className="grid gap-1"
                    noValidate // Disable native validation
                >
                    <CardContent className="space-y-3">
                        <div className="space-y-4 w-full">
                            <Label htmlFor="email" className="sr-only">
                                Email
                            </Label>
                            <div className="relative">
                                <Input
                                    disabled={pending || loadingProvider !== null}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    id="email"
                                    placeholder="Please enter your email address."
                                    type="email"
                                    autoComplete="email"
                                    required
                                />
                                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                    <Mail size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <Label htmlFor="password" className="sr-only">
                                Password
                            </Label>
                            <Input
                                disabled={pending || loadingProvider !== null}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                id="password"
                                placeholder="Please enter your password."
                                autoComplete="current-password"
                                type="password"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            disabled={pending || loadingProvider !== null} // Disable during pending or loadingProvider
                            className="w-full"
                            type="submit"
                        >
                            {pending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Login"
                            )}
                        </Button>
                    </CardFooter>

                </form>
            </Card>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or
                    </span>
                </div>
            </div>
            <Button
                disabled={pending || loadingProvider !== null} // Disable if pending or loadingProvider is set
                onClick={() => handleProviderSignIn("github")}
                variant="outline"
                type="button"
                className="w-full"
            >
                {loadingProvider === "github" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    "Continue with Github"
                )}
            </Button>
            <Button
                disabled={pending || loadingProvider !== null} // Disable if pending or loadingProvider is set
                onClick={() => handleProviderSignIn("google")}
                variant="outline"
                type="button"
                className="w-full"
            >
                {loadingProvider === "google" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    "Continue with Google"
                )}
            </Button>



        </div>

    );
}

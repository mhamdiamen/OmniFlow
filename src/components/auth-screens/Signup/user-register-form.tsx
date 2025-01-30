"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Loader2, Eye, EyeOff, IdCardIcon, User, Mail, ArrowUpCircle, ArrowDown, Check, X, LogIn } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // Assuming shadcn has a Progress component
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";


export function UserRegisterForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {

    const router = useRouter();
    const { signIn } = useAuthActions();

    /*     const [username, setUsername] = useState("");
     */
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [ConfirmPassword, setConfirmPassword] = useState("");
    const [pending, setPending] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<"github" | "google" | null>(null);

    const onPasswordSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== ConfirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setPending(true);
        try {
            await signIn("password", { name, email, password, flow: "signUp" });
            toast.success(`Welcome aboard, ${name}!`);
        } catch (error) {
            toast.error("Invalid email or password");
        } finally {
            setPending(false);
        }
    };


    const handleProviderSignUp = (provider: "github" | "google") => {
        setLoadingProvider(provider);
        signIn(provider)
            .finally(() => {
                setLoadingProvider(null);
            });
    };
    return (
        <div className={cn("grid gap-6 w-full sm:w-[120%] sm:-ml-[10%] ", className)} {...props}>
            <form
                onSubmit={onPasswordSignUp}
                className="grid gap-4"
                noValidate
            >
                {/* Full Name */}
                <div className="grid gap-1">
                    <Label htmlFor="name" className="sr-only">
                        Full Name
                    </Label>
                    <div className="relative">
                        <Input
                            disabled={pending || loadingProvider !== null}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            id="name"
                            placeholder="Enter your full name"
                            type="text"
                            required

                        />
                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <IdCardIcon
                                size={16}
                                strokeWidth={2}

                            />
                        </div>
                    </div>
                </div>

                {/* Email and Username */}
                <div className="grid gap-1">
                    <div className="relative">
                        <Label htmlFor="email" className="sr-only">
                            Email
                        </Label>
                        <Input
                            disabled={pending || loadingProvider !== null}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            id="email"
                            placeholder="Enter an email address"
                            type="email"
                            required

                        />
                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <Mail
                                size={16}
                                strokeWidth={2}

                            />
                        </div>
                    </div>
                    {/*          <div className="relative">
                        <Label htmlFor="username" className="sr-only">
                            Username
                        </Label>
                        <Input
                            disabled={pending || loadingProvider !== null}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            id="username"
                            placeholder="Unique username"
                            type="text"
                            required

                        />
                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <User
                                size={16}
                                strokeWidth={2}

                            />
                        </div>
                    </div> */}
                </div>

                {/* Password and Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <Label htmlFor="password" className="sr-only">
                            Password
                        </Label>
                        <Input
                            disabled={pending || loadingProvider !== null}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            id="password"
                            placeholder="Create a strong password"
                            required

                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center"
                        >

                        </button>
                    </div>
                    <div className="relative">
                        <Label htmlFor="confirmPassword" className="sr-only">
                            Confirm Password
                        </Label>
                        <Input
                            disabled={pending || loadingProvider !== null}
                            value={ConfirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            id="confirmPassword"
                            placeholder="Re-enter your password"
                            required

                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center"
                        >

                        </button>
                    </div>
                </div>



                <Button className="w-full" >Sign Up</Button>

            </form>

            {/* Divider and Alternative Login */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>

            <Button
                disabled={pending || loadingProvider !== null} // Disable if pending or loadingProvider is set
                onClick={() => handleProviderSignUp("github")}
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
                onClick={() => handleProviderSignUp("google")}
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

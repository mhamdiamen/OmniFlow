"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Copy, Trash, UserRoundPlus } from "lucide-react";
import { useId, useRef, useState } from "react";
import StatusSelect from "@/components/RoleManagement/components/StatusSelect";

export default function AddTeamDialog() {
    const id = useId();
    type Field = { email: string; role: string; department: string };
    const [fields, setFields] = useState<Field[]>([{ email: "", role: "", department: "" }]);
    const [copied, setCopied] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastInputRef = useRef<HTMLInputElement>(null);

    const addField = () => {
        setFields([...fields, { email: "", role: "", department: "" }]);
    };

    const handleFieldChange = (index: number, field: string, value: string) => {
        const newFields = [...fields];
        newFields[index][field as keyof Field] = value;
        setFields(newFields);
    };

    const handleDeleteField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
    };

    const handleCopy = () => {
        if (inputRef.current) {
            navigator.clipboard.writeText(inputRef.current.value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Invite members</Button>
            </DialogTrigger>
            <DialogContent
                className="max-w-2xl" // Increase the max-width of the dialog
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    lastInputRef.current?.focus();
                }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="flex size-16 shrink-0 items-center justify-center rounded-full border border-border"
                        aria-hidden="true"
                    >
                        <UserRoundPlus className="opacity-80" size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <DialogHeader>
                            <DialogTitle className="text-left">Invite team members</DialogTitle>
                            <DialogDescription className="text-left">
                                Invite teammates to earn free components.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                        id="team-name"
                        placeholder="Enter team name"
                        value="Static Team Name"
                        readOnly
                    />
                </div>
                <form className="space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Invite via email</Label>
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id={`team-email-${index + 1}`}
                                                placeholder="hi@yourcompany.com"
                                                type="email"
                                                value={field.email}
                                                onChange={(e) => handleFieldChange(index, "email", e.target.value)}
                                                ref={index === fields.length - 1 ? lastInputRef : undefined}
                                                className="flex-1"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <StatusSelect
                                                    label=""
                                                    options={[
                                                        { value: "admin", label: "Admin", dotColor: "text-red-500" },
                                                        { value: "member", label: "Member", dotColor: "text-green-500" },
                                                    ]}
                                                    defaultValue={field.role}
                                                    onChange={(value) => handleFieldChange(index, "role", value)}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <StatusSelect
                                                    label=""
                                                    options={[
                                                        { value: "department1", label: "Department 1", dotColor: "text-blue-500" },
                                                        { value: "department2", label: "Department 2", dotColor: "text-yellow-500" },
                                                    ]}
                                                    defaultValue={field.department}
                                                    onChange={(value) => handleFieldChange(index, "department", value)}
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteField(index)}
                                                aria-label="Delete"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addField}
                            className="text-sm underline hover:no-underline"
                        >
                            + Add another
                        </button>
                    </div>
                    <Button type="button" className="w-full">
                        Send invites
                    </Button>
                </form>

                <hr className="my-1 border-t border-border" />

                <div className="space-y-2">
                    <Label htmlFor={id}>Invite via magic link</Label>
                    <div className="relative">
                        <Input
                            ref={inputRef}
                            id={id}
                            className="pe-9"
                            type="text"
                            defaultValue="https://originui.com/refer/87689"
                            readOnly
                        />
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={handleCopy}
                                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg border border-transparent text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed"
                                        aria-label={copied ? "Copied" : "Copy to clipboard"}
                                        disabled={copied}
                                    >
                                        <div
                                            className={cn(
                                                "transition-all",
                                                copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                                            )}
                                        >
                                            <Check
                                                className="stroke-emerald-500"
                                                size={16}
                                                strokeWidth={2}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div
                                            className={cn(
                                                "absolute transition-all",
                                                copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                                            )}
                                        >
                                            <Copy size={16} strokeWidth={2} aria-hidden="true" />
                                        </div>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="px-2 py-1 text-xs">Copy to clipboard</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

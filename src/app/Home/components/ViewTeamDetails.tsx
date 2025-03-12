import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { EqualApproximatelyIcon, Mail, Phone, UserPlus } from "lucide-react";
import { useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge"; // Import Badge component
import { formatDate } from "@/lib/dateUtils"; // Import formatDate function

interface ViewTeamDetailsSheetProps {
    teamId: Id<"teams">;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ViewTeamDetailsSheet({
    teamId,
    open,
    onOpenChange,
}: ViewTeamDetailsSheetProps) {
    const lastInputRef = useRef<HTMLInputElement>(null);
    const teamDetails = useQuery(api.queries.teams.fetchTeamById, { teamId }) as {
        name: string;
        companyId: string;
        creatorDetails: {
            name: string;
        };
        createdAt: number;
        members: string[];
        description?: string;
        status?: string;
        tags?: string[];
        teamLeaderDetails: {
            _id: Id<"users">;
            name: string;
            email: string;
            image?: string;
            phone?: string;
        };
    };
    const companyUsers = useQuery(
        api.queries.users.fetchUsersByCompanyId,
        teamDetails?.companyId ? { companyId: teamDetails.companyId } : "skip"
    );

    const userOptions = companyUsers?.map(user => ({
        value: user._id,
        label: user.name || user.email,
        email: user.email,
        image: user.image,
        role: user.roleName,
    })) || [];

    const statusOptions: { [key: string]: string } = {
        "Active": "bg-green-500",
        "Inactive": "bg-gray-500",
        "Archived": "bg-red-500",
        "Planning": "bg-blue-500",
        "On Hold": "bg-yellow-500",
        "Completed": "bg-purple-500"
    };

    useEffect(() => {
        if (teamDetails) {
            lastInputRef.current?.focus();
        }
    }, [teamDetails]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="overflow-y-auto sm:max-w-md md:max-w-lg lg:max-w-3xl"
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    lastInputRef.current?.focus();
                }}
            >
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                        <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-full border"
                            aria-hidden="true"
                        >
                            <UserPlus className="opacity-80" size={16} />
                        </div>
                        <SheetHeader>
                            <SheetTitle>Team Details</SheetTitle>
                            <SheetDescription>
                                View the team details and members.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-2 flex items-center">
                                    {teamDetails?.name || "Untitled Team"}
                                </h1>
                                {teamDetails?.status && (
                                    <Badge className={`ml-4 ${statusOptions[teamDetails.status]}`}>
                                        {teamDetails.status}
                                    </Badge>
                                )}
                            </div>
                            {teamDetails?.tags && (
                                <div className="flex flex-wrap gap-2 mt-2 justify-start">
                                    {teamDetails.tags.map((tag) => (
                                        <Badge key={tag}>
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {teamDetails?.description && (
                                <p className="text-sm text-muted-foreground">
                                    {teamDetails.description}
                                </p>
                            )}

                            <span className="block text-sm font-medium mt-1 text-right">
                                <span>Created by </span>
                                <span className="font-bold">{teamDetails?.creatorDetails?.name || "Unknown"}</span>
                                {teamDetails?.createdAt && (
                                    <>
                                        <span> on </span>
                                        <span className="font-bold">{formatDate(teamDetails.createdAt)}</span>
                                    </>
                                )}
                            </span>
                            <div>
                                <Label className="text-lg font-semibold">Team Members</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-2">
                                    {teamDetails?.members.map((memberId) => {
                                        const user = userOptions.find((u) => u.value === memberId);
                                        if (!user) return null;
                                        return (
                                            <div key={memberId} className="flex items-start border p-2 rounded-md shadow-md h-auto">
                                                <Avatar className="h-16 w-16 rounded-lg mr-2 flex-shrink-0">
                                                    {user.image ? (
                                                        <AvatarImage
                                                            src={user.image}
                                                            alt={user.label}
                                                            className="object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <AvatarFallback className="h-full w-full rounded-lg flex items-center justify-center">
                                                            {user.email?.[0]?.toUpperCase() || user.label?.[0]?.toUpperCase() || '?'}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                                    <span className="text-xs truncate uppercase">{user.role}</span>
                                                    <span className="font-semibold text-lg truncate">{user.label}</span>
                                                    <div className="flex items-center text-sm text-muted-foreground truncate">
                                                        <Mail className="mr-2" size={14} />
                                                        <span>{user.email}</span>
                                                    </div>

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4">
                                <Label className="text-lg font-semibold">Team Leader</Label>
                                <div className="mt-2">
                                    {teamDetails?.teamLeaderDetails ? (
                                        <div className="flex items-start border p-2 rounded-md shadow-md h-auto">
                                            <Avatar className="h-16 w-16 rounded-lg mr-2 flex-shrink-0">
                                                {teamDetails.teamLeaderDetails.image ? (
                                                    <AvatarImage
                                                        src={teamDetails.teamLeaderDetails.image}
                                                        alt={teamDetails.teamLeaderDetails.name}
                                                        className="object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <AvatarFallback className="h-full w-full rounded-lg flex items-center justify-center">
                                                        {teamDetails.teamLeaderDetails.email?.[0]?.toUpperCase() || teamDetails.teamLeaderDetails.name?.[0]?.toUpperCase() || '?'}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div className="flex flex-col justify-center flex-1 min-w-0">
                                                <span className="text-xs truncate uppercase">Team Leader</span>
                                                <span className="font-semibold text-lg truncate">{teamDetails.teamLeaderDetails.name}</span>
                                                <div className="flex items-center text-sm text-muted-foreground truncate">
                                                    <Mail className="mr-2" size={14} />
                                                    <span>{teamDetails.teamLeaderDetails.email}</span>
                                                </div>

                                            </div>
                                        </div>
                                    ) : (
                                        "Not assigned"
                                    )}
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BadgeCheck, CalendarIcon, Phone } from "lucide-react";
import { UserWithInvitation } from "./UserTable";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface UserProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserWithInvitation;
}

export function UserProfileSheet({ isOpen, onClose, user }: UserProfileSheetProps) {
    const roles = useQuery(api.queries.roles.getRoles) || [];
    const updateUserRole = useMutation(api.mutations.users.updateUserRole);

    const handleRoleChange = async (newRoleId: string) => {
        const updateRolePromise = async () => {
            try {
                await updateUserRole({ userId: user._id, newRoleId: newRoleId as Id<"roles"> });
                return user.name || user.email; // Return user identifier for success message
            } catch (error) {
                console.error("Failed to update user role:", error);
                throw error; // Rethrow for toast.promise error handler
            }
        };

        // Use toast.promise to handle loading, success, and error states
        toast.promise(updateRolePromise(), {
            loading: `Updating role for ${user.name || user.email}...`,
            success: (userIdentifier) => `Role updated successfully for ${userIdentifier}`,
            error: (error) => {
                const errorMessage = error?.message || "An unknown error occurred";
                
                // You can add specific error handling here if needed
                if (errorMessage.includes("permission denied")) {
                    return "You don't have permission to update this user's role.";
                } else if (errorMessage.includes("role not found")) {
                    return "The selected role could not be found.";
                } else {
                    return `Failed to update role: ${errorMessage}`;
                }
            },
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="flex flex-col items-start relative space-y-4">
                    {/* Avatar and User Info Container */}
                    <div className="flex items-center space-x-4">
                        {/* Avatar Container */}
                        <div className="relative">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.image} alt={user.name || user.email} />
                                <AvatarFallback>{(user.name || user.email).charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            {user.invitationStatus === "accepted" && (
                                <div className="absolute bottom-0 right-0 z-10 bg-blue-500 rounded-full p-1 
                                translate-x-1/4 translate-y-1/4 border-2">
                                    <BadgeCheck className="h-5 w-5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* User Details */}
                        <div>
                            <SheetTitle className="text-2xl font-bold">{user.name || "N/A"}</SheetTitle>
                            <SheetDescription>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <Label>Joined</Label>
                            <p className="font-bold">{user.invitationAcceptedAt ? formatDate(user.invitationAcceptedAt) : "N/A"}</p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Role Section */}
                    <div className="mb-6">
                        <Label className="text-base">Role</Label>
                        <div className="mt-2">
                            <Select
                                defaultValue={user.roleId || ""}
                                onValueChange={handleRoleChange}
                            >
                                <SelectTrigger className="[&_[data-desc]]:hidden">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role._id} value={role._id}>
                                            {role.name}
                                            <span className="mt-1 block text-xs text-muted-foreground" data-desc>
                                                {role.description || "No Description"}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Skills Section */}
                    <div className="mb-6">
                        <Label className="text-base">Skills</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {user.skills && user.skills.length > 0 ? (
                                user.skills.map((skill, index) => (
                                    <Badge key={index} variant="secondary">{skill}</Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No skills listed</p>
                            )}
                        </div>
                    </div>

                    {/* Certifications Section */}
                    <div className="mb-6">
                        <Label className="text-base">Certifications</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {user.certifications && user.certifications.length > 0 ? (
                                user.certifications.map((cert, index) => (
                                    <Badge key={index}>{cert}</Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No certifications listed</p>
                            )}
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <div>
                            <Label className="text-base">Contact Information</Label>
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        {user.phone ? (
                                            <><span className="font-semibold">+216</span> {user.phone}</>
                                        ) : (
                                            "No phone number listed"
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                      
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Placeholder Edit Icon
function Edit({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className={cn("h-4 w-4", className)}
            viewBox="0 0 24 24"
        >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}
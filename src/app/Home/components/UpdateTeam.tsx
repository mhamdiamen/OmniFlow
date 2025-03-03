import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserSelect from "./userselect";
import { toast } from "sonner";

interface UpdateTeamSheetProps {
  teamId: Id<"teams">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateTeamSheet({
  teamId,
  open,
  onOpenChange,
}: UpdateTeamSheetProps) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamLeader, setTeamLeader] = useState(""); // Empty string as initial value
  const lastInputRef = useRef<HTMLInputElement>(null);

  const updateTeam = useMutation(api.mutations.teams.updateTeam);
  const teamDetails = useQuery(api.queries.teams.fetchTeamById, { teamId });
  const currentUser = useQuery(api.users.CurrentUser, {}); // Add this line
  const companyUsers = useQuery(
    api.queries.users.fetchUsersByCompanyId,
    teamDetails?.companyId ? { companyId: teamDetails.companyId } : "skip"
  );

  // Transform company users to the format expected by the select component
  const userOptions = companyUsers?.map(user => ({
    value: user._id,
    label: user.name || user.email,
    email: user.email,
    image: user.image
  })) || [];

  useEffect(() => {
    if (teamDetails) {
      setTeamName(teamDetails.name);
      setSelectedMembers(teamDetails.members as Id<"users">[]);
      setTeamLeader(teamDetails.teamLeaderId || "");
    }
  }, [teamDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !currentUser?._id) { // Add currentUser check
      toast.error("Please enter a team name");
      return;
    }

    setLoading(true);

    try {
      await updateTeam({
        teamId,
        name: teamName,
        members: selectedMembers as Id<"users">[],
        teamLeaderId: teamLeader ? teamLeader as Id<"users"> : undefined,
      });

      toast.success(`Team "${teamName}" updated successfully!`);

      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update team. Please try again.");
      console.error("Failed to update team:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-y-auto sm:max-w-md md:max-w-lg lg:max-w-xl"
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
              <SheetTitle>Update Team</SheetTitle>
              <SheetDescription>
                Update the team details and members.
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-lg font-semibold">Team Name</Label>

                <Input
                  ref={lastInputRef}
                  id="team-name"
                  className="mt-2"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  required
                />
              </div>

              <div>
                <Label className="text-lg font-semibold">Team Members</Label>
                <div className="space-y-2 mt-2">
                  {selectedMembers.map((memberId) => {
                    const user = userOptions.find((u) => u.value === memberId);
                    if (!user) return null;
                    return (
                      <div key={memberId} className="flex items-center justify-between bg-muted p-2 rounded-md mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {user.image ? (
                              <AvatarImage
                                src={user.image}
                                alt={user.label}
                                onError={(e) => {
                                  // If image fails to load, hide it so fallback shows
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}
                            <AvatarFallback>
                              {user.email?.[0]?.toUpperCase() || user.label?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.label}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMembers(selectedMembers.filter(id => id !== memberId))}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                  <div className="mt-4">
                    <UserSelect
                      value=""
                      onChange={(value) => {
                        if (value && !selectedMembers.includes(value)) {
                          setSelectedMembers([...selectedMembers, value]);
                        }
                      }}
                      options={userOptions.filter(option => !selectedMembers.includes(option.value))}
                      label="Members"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div>
                  {/* Team leader selection UI */}
                  <UserSelect
                    value={teamLeader}
                    onChange={setTeamLeader}
                    options={selectedMembers.length > 0
                      ? userOptions.filter(option => selectedMembers.includes(option.value))
                      : []}
                    label="Team Leader"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Team"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

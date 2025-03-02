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
import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserSelect from "./userselect";
import { toast } from "sonner";

interface CreateTeamSheetProps {
  companyId: Id<"companies">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamSheet({
  companyId,
  open,
  onOpenChange,
}: CreateTeamSheetProps) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamLeader, setTeamLeader] = useState(""); // Empty string as initial value
  const lastInputRef = useRef<HTMLInputElement>(null);

  const createTeam = useMutation(api.mutations.teams.createTeam);
  const currentUser = useQuery(api.users.CurrentUser, {});
  const companyUsers = useQuery(api.queries.users.fetchUsersByCompanyId, { companyId });

  // Transform company users to the format expected by the select component
  const userOptions = companyUsers?.map(user => ({
    value: user._id,
    label: user.name || user.email,
    email: user.email,
    image: user.image
  })) || [];

  console.log("CreateTeamSheet rendered with userOptions:", userOptions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !currentUser?._id) {
      toast.error("Please enter a team name");
      return;
    }

    setLoading(true);

    try {
      await createTeam({
        name: teamName,
        companyId,
        members: selectedMembers as Id<"users">[],
        createdBy: currentUser._id,
        teamLeaderId: teamLeader ? teamLeader as Id<"users"> : undefined,
      });

      toast.success(`Team "${teamName}" created successfully!`);

      setTeamName("");
      setSelectedMembers([]);
      setTeamLeader(""); // We still reset the UI state
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create team. Please try again.");
      console.error("Failed to create team:", error);
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
              <SheetTitle>Create Team</SheetTitle>
              <SheetDescription>
                Create a new team and select its members.
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  ref={lastInputRef}
                  id="team-name"
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
                      <div key={memberId} className="flex items-center justify-between bg-muted p-2 rounded-md">
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
                      label="Add Members"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div>
                  {/* Team leader selection UI - Note: Backend support for team leader is not implemented yet */}
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
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
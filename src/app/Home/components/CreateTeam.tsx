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
  const [teamLeader, setTeamLeader] = useState("1"); // Default value for team leader
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
    if (!teamName.trim() || !currentUser?._id) return;

    setLoading(true);
    try {
      await createTeam({
        name: teamName,
        companyId,
        members: selectedMembers as Id<"users">[],
        createdBy: currentUser._id,
      });

      setTeamName("");
      setSelectedMembers([]);
      setTeamLeader("1"); // We still reset the UI state
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create team:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="overflow-y-auto"
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
                <Label>Team Members</Label>
                <div className="space-y-2 mt-2">
                  {selectedMembers.map((memberId) => {
                    const user = userOptions.find((u) => u.value === memberId);
                    if (!user) return null;
                    return (
                      <div key={memberId} className="flex items-center justify-between bg-muted p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.image} alt={user.label} />
                            <AvatarFallback>{user.label[0].toUpperCase()}</AvatarFallback>
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
                  <UserSelect 
                    value=""
                    onChange={(value) => {
                      if (value && !selectedMembers.includes(value)) {
                        setSelectedMembers([...selectedMembers, value]);
                      }
                    }}
                    options={userOptions.filter(option => !selectedMembers.includes(option.value))}
                    label="Add Team Member" 
                  />
                </div>
              </div>

              <div>
                <Label>Team Leader</Label>
                <div className="mt-2">
                  {/* Team leader selection UI - Note: Backend support for team leader is not implemented yet */}
                  <UserSelect 
                    value={teamLeader} 
                    onChange={setTeamLeader} 
                    options={userOptions}
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
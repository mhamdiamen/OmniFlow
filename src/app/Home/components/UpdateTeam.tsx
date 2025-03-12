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
import { Trash, UserPlus } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserSelect from "./userselect";
import { toast } from "sonner";
import { GenreInput } from "@/components/ModulesManagement/components/GenreInput"; // Import GenreInput
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDownIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TextareaWithLimit from "@/components/ModulesManagement/components/TextareaWithLimit";
import { Spinner } from "@/components/ui/ring-spinner";

interface UpdateTeamSheetProps {
  teamId: Id<"teams">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions = [
  { label: "Active", color: "bg-green-500" },
  { label: "Inactive", color: "bg-gray-500" },
  { label: "Archived", color: "bg-red-500" },
  { label: "Planning", color: "bg-blue-500" },
  { label: "On Hold", color: "bg-yellow-500" },
  { label: "Completed", color: "bg-purple-500" },
];

export function UpdateTeamSheet({
  teamId,
  open,
  onOpenChange,
}: UpdateTeamSheetProps) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamLeader, setTeamLeader] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const lastInputRef = useRef<HTMLInputElement>(null);

  const updateTeam = useMutation(api.mutations.teams.updateTeam);
  const teamDetails = useQuery(api.queries.teams.fetchTeamById, { teamId });
  const currentUser = useQuery(api.users.CurrentUser, {});
  const companyUsers = useQuery(
    api.queries.users.fetchUsersByCompanyId,
    teamDetails?.companyId ? { companyId: teamDetails.companyId } : "skip"
  );

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
      setDescription(teamDetails.description || "");
      setStatus(teamDetails.status || "");
      setTags(teamDetails.tags || []);
    }
  }, [teamDetails]);

  useEffect(() => {
    if (open && teamDetails) {
      setTeamLeader(teamDetails.teamLeaderId || "");
      setTags(teamDetails.tags || []);
    }
  }, [open, teamDetails]);

  if (!teamDetails) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner variant="ring" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one team member");
      return;
    }
    if (!teamLeader) {
      toast.error("Please select a team leader");
      return;
    }
    if (!currentUser?._id) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      await updateTeam({
        teamId,
        name: teamName,
        members: selectedMembers as Id<"users">[],
        teamLeaderId: teamLeader ? teamLeader as Id<"users"> : undefined,
        description,
        status,
        tags,
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
              {/* Team Name */}
              <div className="flex items-center gap-4">
                <Label className="text-lg font-semibold w-32"> Name</Label>
                <Input
                  ref={lastInputRef}
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  
                />
              </div>

              {/* Description */}
              <div className="flex items-center gap-4">
                <Label className="text-lg font-semibold w-32">Description</Label>
                <TextareaWithLimit
                  id="description"
                  value={description}
                  onChange={setDescription}
                  maxLength={200}
                  placeholder="Enter team description"
                  className="w-full"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-4">
                <Label className="text-lg font-semibold w-32">Status</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  defaultValue={status}
                >
                  <SelectTrigger className="h-auto ps-2 w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.label} value={option.label}>
                        <span className={`inline-block w-2 h-2 rounded-full ${option.color} mr-2`}></span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-4">
                <Label className="text-lg font-semibold w-32">Tags</Label>
                <div className="w-full"> {/* Add this wrapper div */}
                  <GenreInput
                    id="tags"
                    initialTags={tags.map(tag => ({ id: tag, text: tag }))}
                    onTagsChange={(newTags) => setTags(newTags.map(tag => tag.text))}
                    placeholder="Enter team tags"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Team Members */}
              <div>
                <Label className="text-lg font-semibold">Team Members</Label>
                <div className="space-y-2 mt-2">
                  {selectedMembers.map((memberId) => {
                    const user = userOptions.find((u) => u.value === memberId);
                    if (!user) return null;
                    return (
                      <div key={memberId} className="flex items-center justify-between p-2 rounded-md mb-2 border">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {user.image ? (
                              <AvatarImage
                                src={user.image}
                                alt={user.label}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}
                            <AvatarFallback>
                              {user.email?.[0]?.toUpperCase() || user.label?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm">{user.label}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMembers(selectedMembers.filter(id => id !== memberId))}
                        >
                          <Trash size={14} />
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

              {/* Team Leader */}
              <div className="mt-4">
                <div>
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

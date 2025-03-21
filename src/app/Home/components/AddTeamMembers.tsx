"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, UserPlus, Trash } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import UserSelect from "./userselect";

type AddTeamMembersSheetProps = {
  teamId: Id<"teams">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddTeamMembersSheet({ teamId, open, onOpenChange }: AddTeamMembersSheetProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch team details
  const team = useQuery(api.queries.teams.fetchTeamById, { teamId });
  
  // Fetch company users
  const companyId = team?.companyId;
  const companyUsers = useQuery(
    api.queries.users.fetchUsersByCompanyId,
    companyId ? { companyId } : "skip"
  );

  // Add team members mutation
  const addTeamMembers = useMutation(api.mutations.teams.addTeamMembers);
  const currentUser = useQuery(api.users.CurrentUser, {});

  // Transform company users to the format expected by the select component
  const userOptions = React.useMemo(() => {
    if (!companyUsers || !team) return [];
    
    // Filter out users who are already team members
    return companyUsers
      .filter(user => !team.members.includes(user._id))
      .map(user => ({
        value: user._id,
        label: user.name || user.email,
        email: user.email,
        image: user.image
      }));
  }, [companyUsers, team]);

  // Reset selected users when sheet opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedMembers([]);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one user to add to the team");
      return;
    }

    // Validate that all selected members exist in userOptions
    const validMembers = selectedMembers.filter(memberId => 
      userOptions.some(option => option.value === memberId)
    );
    
    if (validMembers.length !== selectedMembers.length) {
      toast.error("Some selected users could not be found. Please refresh and try again.");
      return;
    }

    if (!currentUser) {
      toast.error("You must be logged in to add team members");
      return;
    }

    setLoading(true);
    
    try {
      await addTeamMembers({
        teamId,
        memberIds: validMembers as Id<"users">[],
      });
      
      toast.success("Team members added successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding team members:", error);
      toast.error("Failed to add team members: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = (value: string) => {
    if (value && !selectedMembers.includes(value)) {
      setSelectedMembers([...selectedMembers, value]);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(id => id !== memberId));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md md:max-w-lg lg:max-w-xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <UserPlus className="opacity-80" size={16} />
            </div>
            <SheetHeader>
              <SheetTitle>Add Team Members</SheetTitle>
              <SheetDescription>
                Enhance your team with new collaborators
              </SheetDescription>
            </SheetHeader>
          </div>

          {team && (
            <div className="mb-4">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {team.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                {team.memberCount} member{team.memberCount !== 1 ? 's' : ''} • 
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {team.status || 'Active'}
                </span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
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
                          onClick={() => handleRemoveMember(memberId)}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    );
                  })}
                  <div className="mt-4">
                    <UserSelect
                      value=""
                      onChange={handleAddMember}
                      options={userOptions.filter(option => !selectedMembers.includes(option.value))}
                      label="Add Member"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
            
              <Button type="submit" disabled={loading || selectedMembers.length === 0} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Members
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
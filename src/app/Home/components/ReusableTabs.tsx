import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, ChartLine, House, PanelsTopLeft, Settings, UsersRound } from "lucide-react";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import AppearanceSettings from "./CompanySettings";
import CompanySettings from "./CompanySettings";
import ModuleCard from "@/components/ModulesManagement/components/ModuleCard";
import EmailSender from "./EmailSender";
import InviteUserForm from "./InviteUserForm";
import { UserTable } from "./UserTable"; // Import the UserTable component
import { TeamsTable } from "./TeamsTable"; // Add this import at the top with other imports
import { Id } from "../../../../convex/_generated/dataModel";

export default function ReusableTabs() {
  const currentUser = useQuery(api.users.CurrentUser); // Fetch current user
  const userCompany = useQuery(api.queries.company.getCompanyByOwner); // Fetch company
  const modules = useQuery(api.queries.modules.fetchAllModules, {
    companyId: userCompany?._id || undefined, // Pass companyId to the query
  });

  // Fetch users by company ID
  const users = useQuery(api.queries.users.fetchUsersByCompanyId, {
    companyId: userCompany?._id || "",
  });
  
  // Use "skip" to conditionally skip the query when userCompany doesn't exist
  const usersWithInvitations = useQuery(
    api.queries.users.fetchUsersWithInvitationByCompanyId, 
    userCompany ? { companyId: userCompany._id } : "skip"
  );

  return (
    <Tabs defaultValue="tab-1">
      <ScrollArea>
        <TabsList className="mb-3 h-auto gap-2 rounded-none border-b border-border bg-transparent px-0 py-1 text-foreground">
          <TabsTrigger
            value="tab-1"
            className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
          >
            <House
              className="-ms-0.5 me-1.5 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Overview
          </TabsTrigger>

          <TabsTrigger
            value="tab-2"
            className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
          >
            <UsersRound
              className="-ms-0.5 me-1.5 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Team
          </TabsTrigger>
          <TabsTrigger
            value="tab-3"
            className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
          >
            <UsersRound
              className="-ms-0.5 me-1.5 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Members
          </TabsTrigger>
          <TabsTrigger
            value="tab-4"
            className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
          >
            <ChartLine
              className="-ms-0.5 me-1.5 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Modules
          </TabsTrigger>
          <TabsTrigger
            value="tab-5"
            className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
          >
            <Settings
              className="-ms-0.5 me-1.5 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Settings
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <TabsContent value="tab-1">
        <p className="pt-1 text-center text-xs text-muted-foreground">Content for Tab 1</p>
      </TabsContent>
      <TabsContent value="tab-2">
        {userCompany ? (
          <TeamsTable companyId={userCompany._id} />
        ) : (
          <p>Loading teams...</p>
        )}
      </TabsContent>
      <TabsContent value="tab-3">
        {/* Display the UserTable in the Members tab */}
        {userCompany && usersWithInvitations ? (
          <UserTable users={usersWithInvitations} /> // Pass the updated data
        ) : (
          <p>Loading users...</p>
        )}
      </TabsContent>
      <TabsContent value="tab-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {modules && userCompany ? (
            modules.map((module) => (
              <ModuleCard
                key={module._id}
                title={module.name}
                description={module.description || ""}
                createdAt={module._creationTime.toString()}
                categories={module.category ? module.category.split(", ") : []}
                activationCount={typeof module.activationCount === 'bigint' ? Number(module.activationCount) : module.activationCount || 0}
                isActive={module.isActive}
                moduleId={module._id}
                companyId={userCompany._id}
              />
            ))
          ) : (
            <p>Loading modules...</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="tab-5">
        <CompanySettings />
      </TabsContent>
    </Tabs>
  );
}
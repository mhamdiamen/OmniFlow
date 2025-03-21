import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, ChartLine, House, PanelsTopLeft, Settings, UsersRound } from "lucide-react";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import CompanySettings from "./CompanySettings";
import ModuleCard from "@/components/ModulesManagement/components/ModuleCard";
import { UserTable } from "./UserTable";
import { TeamsTable } from "./TeamsTable";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ReusableTabs() {
  const currentUser = useQuery(api.users.CurrentUser);
  const userCompany = useQuery(api.queries.company.getCompanyByOwner);
  const modules = useQuery(api.queries.modules.fetchAllModules, {
    companyId: userCompany?._id || undefined,
  });

  const usersWithInvitations = useQuery(
    api.queries.users.fetchUsersWithInvitationByCompanyId,
    userCompany ? { companyId: userCompany._id } : "skip"
  );

  // Get count of teams for badge
  const teams = useQuery(
    api.queries.teams.fetchTeamsByCompany,
    userCompany ? { companyId: userCompany._id } : "skip"
  );
  const teamCount = teams?.length || 0;

  return (
    <Tabs defaultValue="tab-1">
      <ScrollArea>
        <TabsList className="mb-3">
          <TabsTrigger value="tab-1">
            <House className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
            Overview
          </TabsTrigger>

          <TabsTrigger value="tab-2" className="group">
            <UsersRound className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
            Team
            <Badge
              className="bg-primary/15 ms-1.5 min-w-5 px-1 transition-opacity group-data-[state=inactive]:opacity-50"
              variant="secondary"
            >
              {teamCount}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="tab-3" className="group">
            <UsersRound className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
            Members
            {usersWithInvitations && (
              <Badge
                className="bg-primary/15 ms-1.5 min-w-5 px-1 transition-opacity group-data-[state=inactive]:opacity-50"
                variant="secondary"
              >
                {usersWithInvitations.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="tab-4" className="group">
            <ChartLine className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
            Modules
            {modules && (
              <Badge
                className="bg-primary/15 ms-1.5 min-w-5 px-1 transition-opacity group-data-[state=inactive]:opacity-50"
                variant="secondary"
              >
                {modules.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="tab-5">
            <Settings className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
            Settings
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <TabsContent value="tab-1">
        <p className="text-muted-foreground p-4 pt-1 text-center text-xs">Content for Tab 1</p>
      </TabsContent>

      <TabsContent value="tab-2">
        {userCompany ? (
          <TeamsTable companyId={userCompany._id} />
        ) : (
          <p className="text-muted-foreground p-4 pt-1 text-center text-xs">Loading teams...</p>
        )}
      </TabsContent>

      <TabsContent value="tab-3">
        {userCompany && usersWithInvitations ? (
          <UserTable users={usersWithInvitations} />
        ) : (
          <p className="text-muted-foreground p-4 pt-1 text-center text-xs">Loading users...</p>
        )}
      </TabsContent>

      <TabsContent value="tab-4">
        <div className="space-y-8">
          <div className="text-left">
            <h2 className="text-5xl font-bold tracking-tight">
              Available Modules
            </h2>
            <p className="text-muted-foreground mt-4">
              Browse and manage your company's modules. Each module represents a distinct functionality that can be activated and used within your organization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules && userCompany ? (
              modules.map((module) => (
                <ModuleCard
                  key={module._id}
                  title={module.name}
                  description={module.description || ""}
                  createdAt={module._creationTime.toString()}
                  categories={module.category ? module.category.split(", ") : []}
                  activationCount={
                    typeof module.activationCount === 'bigint' 
                      ? Number(module.activationCount) 
                      : module.activationCount || 0
                  }
                  isActive={module.isActive}
                  moduleId={module._id}
                  companyId={userCompany._id}
                />
              ))
            ) : (
              <p className="text-muted-foreground p-4 pt-1 text-center text-xs">
                Loading modules...
              </p>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="tab-5">
        <CompanySettings />
      </TabsContent>
    </Tabs>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CompanyCreationDialog from "@/components/company-creation-dialog";
import CompanySettingsDialog from "@/components/company-settings-dialog";
import { Loader2 } from "lucide-react";
// Import the ReusableTabs component and its TabItem type
import { ReusableTabs, TabItem } from "@/components/ReusableTabs";

export default function Home() {
  const me = useQuery(api.auth.getMe);
  const currentUser = useQuery(api.users.CurrentUser);
  const userCompany = useQuery(api.queries.company.getCompanyByOwner); // Fetch company

  const createCompany = useMutation(api.mutations.company.createCompany);

  const [showDialog, setShowDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Detect when userCompany is done loading
  useEffect(() => {
    if (userCompany !== undefined) {
      setIsLoading(false);
    }
  }, [userCompany]);

  async function handleCreateCompany() {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      await createCompany({ name: companyName });
      toast.success("Company created successfully!");
      setShowDialog(false);
    } catch (error) {
      toast.error("Error creating company");
      console.error(error);
    }
  }

  // Define tabs data to be used by ReusableTabs
  const tabsData: TabItem[] = [
    {
      value: "overview",
      label: "Overview",
      // Example icon (you can use any icon component)
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M8 1v14M1 8h14" />
        </svg>
      ),
      content: (
        <p className="p-4 pt-1 text-center text-xs text-muted-foreground">
          Welcome! This is the Overview tab.
        </p>
      ),
    },
    {
      value: "modules",
      label: "Modules",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="2" y="2" width="12" height="12" rx="2" />
        </svg>
      ),
      content: (
        <p className="p-4 pt-1 text-center text-xs text-muted-foreground">
          Configure your modules here.
        </p>
      ),
    },
    {
      value: "settings",
      label: "Settings",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="8" cy="8" r="3" />
          <path d="M2 2l4 4m8-4l-4 4M2 14l4-4m8 4l-4-4" />
        </svg>
      ),
      content: (
        <p className="p-4 pt-1 text-center text-xs text-muted-foreground">
          Update your settings.
        </p>
      ),
    },
  ];

  return (
    <AdminPanelLayout>
      <ContentLayout title="Recent Stories">
        {me?.role === "admin" && (
          <Card className="w-96 h-64 flex items-center justify-center">Hello Admin</Card>
        )}
        {me?.role === "read" && (
          <Card className="w-96 h-64 flex items-center justify-center">Hello Reader</Card>
        )}
        {me?.role === "write" && (
          <>
            <h3 className="text-2xl font-semibold">Home</h3>
            <p>Overview of your activities and trends.</p>
          </>
        )}
      </ContentLayout>

      {isLoading ? (
        <Button variant="outline" disabled>
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
        </Button>
      ) : userCompany ? (
        <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
          Settings
        </Button>
      ) : (
        <Button variant="outline" onClick={() => setShowDialog(true)}>
          Create Company
        </Button>
      )}

      <CompanyCreationDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        companyName={companyName}
        setCompanyName={setCompanyName}
        handleCreateCompany={handleCreateCompany}
      />

      <CompanySettingsDialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        company={
          userCompany
            ? {
              id: userCompany._id,
              name: userCompany.name,
              createdAt: userCompany.createdAt,
              modules: userCompany.modules,
              settings: userCompany.settings ?? {},
            }
            : null
        }
      />

      {/* Render the reusable tabs component */}
      <div className="mt-8 w-full">
        <ReusableTabs items={tabsData} defaultValue="overview" className="w-full" />
      </div>

    </AdminPanelLayout>
  );
}

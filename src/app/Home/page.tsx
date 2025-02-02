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
import { Loader2 } from "lucide-react"; // Import a loader icon
import { ReusableStepper } from "./components/reusable-stepper";

// Import the Stepper demo (or your customized stepper component)

export default function Home() {
  const me = useQuery(api.auth.getMe);
  const currentUser = useQuery(api.users.CurrentUser);
  const userCompany = useQuery(api.queries.company.getCompanyByOwner); // Fetch company

  const createCompany = useMutation(api.mutations.company.createCompany);

  const [showDialog, setShowDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  // Track if we want to show the onboarding stepper
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Detect when userCompany is done loading
  useEffect(() => {
    if (userCompany !== undefined) {
      setIsLoading(false);
      // If company exists, we could optionally show the onboarding stepper.
      // For example, if there are modules not yet configured.
      if (userCompany && !userCompany.modules?.length) {
        setShowOnboarding(true);
      }
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
      // Optionally start the onboarding stepper after company creation.
      setShowOnboarding(true);
    } catch (error) {
      toast.error("Error creating company");
      console.error(error);
    }
  }

  return (
    <AdminPanelLayout>
      <ContentLayout title="Recent Stories">
        {me?.role === "admin" && (
          <Card className="w-96 h-64 flex items-center justify-center">
            Hello Admin
          </Card>
        )}
        {me?.role === "read" && (
          <Card className="w-96 h-64 flex items-center justify-center">
            Hello Reader
          </Card>
        )}
        {me?.role === "write" && (
          <>
            <h3 className="text-2xl font-semibold">Home</h3>
            <p>Overview of your activities and trends.</p>
          </>
        )}
      </ContentLayout>

      {/* Loader before showing the correct button */}
      {isLoading ? (
        <Button variant="outline" disabled>
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
        </Button>
      ) : userCompany ? (
        <Button
          variant="outline"
          onClick={() => setShowSettingsDialog(true)}
        >
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
                name: userCompany.name,
                createdAt: userCompany.createdAt,
                modules: userCompany.modules,
                settings: userCompany.settings ?? {},
              }
            : null
        }
      />

      {/* Conditionally render the stepper for onboarding or guiding module setup */}
      {showOnboarding && (
        <div className="mt-8">
          <ReusableStepper />
        </div>
      )}
    </AdminPanelLayout>
  );
}

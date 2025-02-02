"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CompanyCreationDialog from "@/components/company-creation-dialog";
import CompanySettingsDialog from "@/components/company-settings-dialog";
import { Loader2 } from "lucide-react"; // Import a loader icon
import Home from "./Home/page";

export default function HomePage() {


  return (
    <Home />
  );
}

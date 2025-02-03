"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { DynamicDropzone } from "./DynamicDropzone";

export default function CompanySettings() {
  // Fetch the current company
  const company = useQuery(api.queries.company.getCompanyByOwner);

  // Mutations for updating company and generating an upload URL
  const updateCompany = useMutation(api.mutations.company.updateCompany);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Core fields
  const [companyName, setCompanyName] = useState("");
  // New logo URL state (which in this case stores the storageId)
  const [logoUrl, setLogoUrl] = useState("");
  // Contact fields
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  // Address fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  // Business details
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  // Social links
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Sync state when company data is loaded
  useEffect(() => {
    if (company) {
      setCompanyName(company.name || "");
      setLogoUrl(company.logoUrl || "");
      setWebsite(company.website || "");
      setPhone(company.phone || "");
      setCompanyEmail(company.email || "");
      setStreet(company.address?.street || "");
      setCity(company.address?.city || "");
      setStateField(company.address?.state || "");
      setZip(company.address?.zip || "");
      setCountry(company.address?.country || "");
      setIndustry(company.industry || "");
      setSize(company.size || "");
      setFacebook(company.socialLinks?.facebook || "");
      setTwitter(company.socialLinks?.twitter || "");
      setLinkedin(company.socialLinks?.linkedin || "");
    }
  }, [company]);

  // File upload handler that integrates with Convex file storage
  const handleFileDrop = async (file: File) => {
    try {
      // 1. Get an upload URL from Convex
      const uploadUrl = await generateUploadUrl();
      if (!uploadUrl) {
        throw new Error("Failed to generate upload URL");
      }
      
      // 2. Upload the file using a POST request to the returned URL
      const response = await fetch(uploadUrl, {
        method: "POST", // changed from PUT to POST
        body: file,
        headers: { "Content-Type": file.type },
      });
      
      // Optionally, log the status and any response text for debugging:
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error status:", response.status, errorText);
        throw new Error("File upload failed");
      }
      
      // 3. Parse the response to extract the storageId
      const { storageId } = await response.json();
      return { status: "success" as const, result: storageId };
    } catch (error: any) {
      console.error("Upload error:", error);
      return { status: "error" as const, error: error.message };
    }
  };
  

  // Handle form submission to update company settings
  const handleSave = async () => {
    if (company?._id) {
      await updateCompany({
        companyId: company._id,
        name: companyName,
        logoUrl, // This stores the storageId that will later be converted to a URL by getFileUrl
        website,
        phone,
        email: companyEmail,
        address: {
          street,
          city,
          state: stateField,
          zip,
          country,
        },
        industry,
        size,
        socialLinks: {
          facebook,
          twitter,
          linkedin,
        },
      });
      toast.success("Company settings updated successfully!");
    }
  };

  return (
    <div className="max-w-full space-y-8">
      {/* Page Title */}
      <div className="mt-10">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          {companyName || "Company Settings"} Settings
        </h1>
        <p className="mt-2 text-gray-500">
          Manage your company’s appearance and identity settings.
        </p>
      </div>

      <Separator />

      {/* Company Logo Section (File Uploader) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Company Logo</h2>
        <DynamicDropzone
          onDropFile={async (file) => {
            const result = await handleFileDrop(file);
            if (result.status === "success") {
              // Save the storageId as logoUrl; DynamicDropzone will later query for the served URL
              setLogoUrl(result.result);
            }
            return result;
          }}
          initialPreview={logoUrl}
          triggerLabel="Upload Company Logo"
          triggerDescription="Select an image smaller than 10MB"
          fallbackText="Logo"
        />
      </div>

      <Separator />

      {/* Two-column Layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column */}
        <div className="flex-1 space-y-8">
          {/* Core Company Name */}
          <div className="flex items-center gap-6">
            <Label htmlFor="company-name" className="text-md font-bold w-40">
              Company Name
            </Label>
            <div className="flex-1 flex flex-col">
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                className="max-w-lg"
              />
              <p className="mt-1 text-xs text-gray-500">
                This name is the main displayed name across the platform.
              </p>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <div className="flex items-center gap-6">
              <Label htmlFor="website" className="text-md font-bold w-40">
                Website
              </Label>
              <div className="flex-1">
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="max-w-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Label htmlFor="phone" className="text-md font-bold w-40">
                Phone
              </Label>
              <div className="flex-1">
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your contact phone"
                  className="max-w-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Label htmlFor="company-email" className="text-md font-bold w-40">
                Email
              </Label>
              <div className="flex-1">
                <Input
                  id="company-email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="Enter your contact email"
                  className="max-w-lg"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Address</h2>
            <div className="flex items-center gap-6">
              <Label htmlFor="street" className="text-md font-bold w-40">
                Street
              </Label>
              <div className="flex-1">
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street address"
                  className="max-w-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Label htmlFor="city" className="text-md font-bold w-40">
                City
              </Label>
              <div className="flex-1">
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="max-w-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Label htmlFor="state" className="text-md font-bold w-40">
                State
              </Label>
              <div className="flex-1">
                <Input
                  id="state"
                  value={stateField}
                  onChange={(e) => setStateField(e.target.value)}
                  placeholder="State/Province"
                  className="max-w-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Label htmlFor="zip" className="text-md font-bold w-40">
                ZIP Code
              </Label>
              <div className="flex-1">
                <Input
                  id="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="ZIP/Postal Code"
                  className="max-w-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Label htmlFor="country" className="text-md font-bold w-40">
                Country
              </Label>
              <div className="flex-1">
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  className="max-w-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-8">
          {/* Business Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Business Details</h2>
            <div className="flex items-center gap-6">
              <Label htmlFor="industry" className="text-md font-bold w-40">
                Industry
              </Label>
              <div className="flex-1">
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., Manufacturing, Tech"
                  className="max-w-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Label htmlFor="size" className="text-md font-bold w-40">
                Company Size
              </Label>
              <div className="flex-1">
                <Input
                  id="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g., 1-10, 11-50"
                  className="max-w-lg"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Social Links */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Social Links</h2>
            <div className="flex items-center gap-6">
              <Label htmlFor="facebook" className="text-md font-bold w-40">
                Facebook
              </Label>
              <div className="flex-1">
                <Input
                  id="facebook"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="Facebook URL"
                  className="max-w-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Label htmlFor="twitter" className="text-md font-bold w-40">
                Twitter
              </Label>
              <div className="flex-1">
                <Input
                  id="twitter"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="Twitter URL"
                  className="max-w-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Label htmlFor="linkedin" className="text-md font-bold w-40">
                LinkedIn
              </Label>
              <div className="flex-1">
                <Input
                  id="linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="LinkedIn URL"
                  className="max-w-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button Aligned to the Right */}
      <div className="flex justify-end">
        <Button className="mt-4" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

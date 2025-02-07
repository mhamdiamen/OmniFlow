"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Import Card components
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { DynamicDropzone } from "./DynamicDropzone";
import { FileUploader } from "./file-uploader/file-uploader";
import { Mail, Globe, Phone, MapPin, Building, Users, Facebook, Twitter, Linkedin, Landmark, Rss, PhoneCall, AtSign, FolderPen } from "lucide-react";
import { validateEmail } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useSliderWithInput } from "@/hooks/use-slider-with-input";

export default function CompanySettings() {

  // Fetch the current company
  const company = useQuery(api.queries.company.getCompanyByOwner);

  // Mutations for updating company and generating an upload URL
  const updateCompany = useMutation(api.mutations.company.updateCompany);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Core fields
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [emailError, setEmailError] = useState("");
  const minSize = 0;
  const maxSize = 1000;
  const initialSize = [50, 150];

  // Inside the CompanySettings component

  const {
    sliderValue: sizeSliderValue,
    inputValues: sizeInputValues,
    validateAndUpdateValue: validateSizeValue,
    handleInputChange: handleSizeInputChange,
    handleSliderChange: handleSizeSliderChange,
  } = useSliderWithInput({
    minValue: minSize,
    maxValue: maxSize,
    initialValue: initialSize,
  });

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

      // Parse the size field (e.g., "50-150" => [50, 150])
      if (company.size) {
        const [min, max] = company.size.split("-").map(Number);
        handleSizeSliderChange([min, max]); // Update both slider and input values
      } else {
        handleSizeSliderChange(initialSize); // Default values
      }

      setFacebook(company.socialLinks?.facebook || "");
      setTwitter(company.socialLinks?.twitter || "");
      setLinkedin(company.socialLinks?.linkedin || "");
    }
  }, [company]);
  // Handle form submission
  const handleSave = async () => {
    if (company?._id) {
      if (!validateEmail(companyEmail)) {
        setEmailError("Please enter a valid email address.");
        toast.error("Please correct the email address before saving.");
        return;
      }

      // Format the size range as a string (e.g., "50-150")
      const companySizeRange = `${sizeInputValues[0]}-${sizeInputValues[1]}`;

      await updateCompany({
        companyId: company._id,
        name: companyName,
        logoUrl,
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
        size: companySizeRange, // Save the slider range as a string
        socialLinks: {
          facebook,
          twitter,
          linkedin,
        },
      });
      toast.success("Company settings updated successfully!");
    }
  };
  // File upload handler
  const handleFileDrop = async (file: File) => {
    try {
      const uploadUrl = await generateUploadUrl();
      if (!uploadUrl) throw new Error("Failed to generate upload URL");

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error:", response.status, errorText);
        throw new Error("File upload failed");
      }

      const { storageId } = await response.json();
      setLogoUrl(storageId);
      return { status: "success", result: storageId };
    } catch (error: any) {
      console.error("Upload error:", error);
      return { status: "error", error: error.message };
    }
  };




  return (
    <div className="max-w-full space-y-8">
      {/* Page Title */}
      <div className="flex items-start justify-between mt-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          {companyName || "Company Settings"} Settings
        </h1>
        <Button className="ml-4" onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      <p className="mt-2 text-gray-500">
        Manage your company’s appearance and identity settings.
      </p>

      <Separator />

      {/* Two-column Layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column */}
        <div className="flex-1 space-y-8">
          {/* Core Company Name */}
          <div>
            <h2 className="text-xl font-bold">Company Name</h2>
            <p className="text-sm text-muted-foreground">
              This will be your company's primary name displayed on the platform.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Label htmlFor="company-name" className="text-sm font-bold w-32">
                Company Name
              </Label>
              <div className="relative flex flex-1">

              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                className="flex-1"
              />
               <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <FolderPen size={16} strokeWidth={2} aria-hidden="true" />
                  </div>
            </div>
            </div>
          </div>
          <Separator />

          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-bold">Contact Information</h2>
            <p className="text-sm text-muted-foreground">
              Provide details to help others reach your company easily.
            </p>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="website" className="text-sm font-bold w-32">
                  Website
                </Label>
                <div className="relative flex flex-1">
                  <span className="inline-flex items-center rounded-l-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                    https://
                  </span>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="yourcompany.com"
                    className="-ms-px rounded-s-none shadow-none flex-1"
                    type="text"
                  />
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <Rss size={16} strokeWidth={2} aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="phone" className="text-sm font-bold w-32">
                  Phone
                </Label>
                <div className="relative flex flex-1">
                  <span className="inline-flex items-center rounded-l-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                    +216
                  </span>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter your contact phone"
                    className="-ms-px rounded-s-none shadow-none flex-1"
                    type="text"
                  />
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <PhoneCall size={16} strokeWidth={2} aria-hidden="true" />
                  </div>
                </div>
              </div>


              <div className="flex items-center gap-4">
                <Label htmlFor="company-email" className="text-sm font-bold w-32">
                  Email
                </Label>
                <div className="relative flex flex-1">

                  <Input
                    id="company-email"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="Enter your contact email"
                    className="flex-1"
                  />
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <AtSign size={16} strokeWidth={2} aria-hidden="true" />
                  </div>
                </div>
              </div>

            </div>
          </div>
          <Separator />
          {/* Social Links */}
          <div>
            <h2 className="text-xl font-bold">Social Links</h2>
            <p className="text-sm text-muted-foreground">
              Share links to your company’s social media profiles.
            </p>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
              <Label htmlFor="facebook" className="text-sm font-bold w-32">Facebook</Label>
              <div className="relative flex flex-1">
                <span className="inline-flex items-center rounded-l-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                www.
                </span>
                <Input
                id="facebook"
                value={facebook.replace(/^www\./, "").replace(/\.com$/, "")}
                onChange={(e) =>
                  setFacebook(`www.${e.target.value.replace(/\.com$/, "")}.com`)
                }
                placeholder="facebook/yourPage"
                className="-ms-px rounded-none shadow-none flex-1"
                />
                <span className="inline-flex items-center rounded-r-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                .com
                </span>
              </div>
              </div>

              <div className="flex items-center gap-4">
              <Label htmlFor="twitter" className="text-sm font-bold w-32">Twitter</Label>
              <div className="relative flex flex-1">
                <span className="inline-flex items-center rounded-l-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                www.
                </span>
                <Input
                id="twitter"
                value={twitter.replace(/^www\./, "").replace(/\.com$/, "")}
                onChange={(e) =>
                  setTwitter(`www.${e.target.value.replace(/\.com$/, "")}.com`)
                }
                placeholder="twitter/yourHandle"
                className="-ms-px rounded-none shadow-none flex-1"
                />
                <span className="inline-flex items-center rounded-r-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                .com
                </span>
              </div>
              </div>

              <div className="flex items-center gap-4">
              <Label htmlFor="linkedin" className="text-sm font-bold w-32">LinkedIn</Label>
              <div className="relative flex flex-1">
                <span className="inline-flex items-center rounded-l-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                www.
                </span>
                <Input
                id="linkedin"
                value={linkedin.replace(/^www\./, "").replace(/\.com$/, "")}
                onChange={(e) =>
                  setLinkedin(`www.${e.target.value.replace(/\.com$/, "")}.com`)
                }
                placeholder="linkedin/in/yourProfile"
                className="-ms-px rounded-none shadow-none flex-1"
                />
                <span className="inline-flex items-center rounded-r-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                .com
                </span>
              </div>
              </div>
            </div>
          </div>

          {/* Company Logo Section */}
          {/*  <div>
            <h2 className="text-xl font-bold">Company Logo</h2>
            <p className="text-sm text-muted-foreground">
              Upload your company’s logo to personalize your profile.
            </p>
            <div className="space-y-4 mt-4">
              <FileUploader
                onUpload={async (files) => {
                  const file = files[0];
                  const result = await handleFileDrop(file);
                  if (result.status === "success") {
                    setLogoUrl(result.result);
                  }
                }}
                initialPreview={logoUrl}
                maxFileCount={1}
                accept={{ "image/*": [] }}
                maxSize={10 * 1024 * 1024} // 10MB
              />
            </div>
          </div>
 */}
        </div>
        <Separator orientation="vertical" />
        {/* Right Column */}
        <div className="flex-1 space-y-8">
          {/* Business Details */}
          <div>
            <h2 className="text-xl font-bold">Business Details</h2>
            <p className="text-sm text-muted-foreground">
              Specify the category or industry your company operates in.
            </p>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
              <Label htmlFor="industry" className="text-sm font-bold w-32">Industry</Label>
              <div className="relative flex flex-1">
                <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Specify your industry"
                className="flex-1"
                />
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Building size={16} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
              </div>

              <div className="flex items-center gap-4">
              <Label htmlFor="size" className="text-sm font-bold w-32">Company Size</Label>
              <div className="flex items-center gap-4 flex-1">
                <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={sizeInputValues[0]}
                onChange={(e) => handleSizeInputChange(e, 0)}
                onBlur={() => validateSizeValue(sizeInputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                  validateSizeValue(sizeInputValues[0], 0);
                  }
                }}
                aria-label="Enter minimum value"
                />
                <Slider
                className="grow"
                value={sizeSliderValue}
                onValueChange={handleSizeSliderChange}
                min={minSize}
                max={maxSize}
                step={1}
                aria-label="Dual range slider with input"
                />
                <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={sizeInputValues[1]}
                onChange={(e) => handleSizeInputChange(e, 1)}
                onBlur={() => validateSizeValue(sizeInputValues[1], 1)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                  validateSizeValue(sizeInputValues[1], 1);
                  }
                }}
                aria-label="Enter maximum value"
                />
              </div>
              </div>
            </div>
          </div>
          <Separator />
          {/* Address Information */}
          <div>
            <h2 className="text-xl font-bold">Address</h2>
            <p className="text-sm text-muted-foreground">
              Enter your official business address for correspondence.
            </p>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
              <Label htmlFor="street" className="text-sm font-bold w-32">Street</Label>
              <div className="relative flex flex-1">
                <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street address"
                className="flex-1"
                />
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Building size={16} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
              </div>

              <div className="flex items-center gap-4">
              <Label htmlFor="city" className="text-sm font-bold w-32">City</Label>
              <div className="relative flex flex-1">
                <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="flex-1"
                />
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Landmark size={16} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
              </div>

              <div className="flex items-center gap-4">
              <Label htmlFor="state" className="text-sm font-bold w-32">State</Label>
              <div className="relative flex flex-1">
                <Input
                id="state"
                value={stateField}
                onChange={(e) => setStateField(e.target.value)}
                placeholder="State/Province"
                className="flex-1"
                />
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <MapPin size={16} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
              </div>

              <div className="flex items-center gap-4">
              <Label htmlFor="zip" className="text-sm font-bold w-32">ZIP Code</Label>
              <div className="relative flex flex-1">
                <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="ZIP/Postal Code"
                className="flex-1"
                />
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Mail size={16} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
              </div>

              <div className="flex items-center gap-4">
              <Label htmlFor="country" className="text-sm font-bold w-32">Country</Label>
              <div className="relative flex flex-1">
                <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                className="flex-1"
                />
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Globe size={16} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
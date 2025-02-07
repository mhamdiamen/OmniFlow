import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; // Import Switch component
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { useId, useState } from "react"; // Import useState
import { formatDate } from "@/lib/dateUtils"; // Import formatDate function
import { Package } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface ModuleCardProps {
    title: string;
    description: string;
    createdAt: string;
    categories: string[];
    activationCount: number;
    isActive: boolean;
    moduleId: Id<"modules">;
    companyId: Id<"companies">; // Add companyId prop
}

export default function ModuleCard({
    title,
    description,
    createdAt,
    categories,
    activationCount,
    isActive: initialIsActive, // Update prop name
    moduleId,
    companyId, // Add companyId prop
}: ModuleCardProps) {
    const id = useId();
    const [isActive, setIsActive] = useState(initialIsActive); // Add local state
    const activateModule = useMutation(api.mutations.companyModules.activateModuleForCompany);
    const deactivateModule = useMutation(api.mutations.companyModules.deactivateModuleForCompany);

    const handleToggle = async () => {
        try {
            if (isActive) {
                await deactivateModule({ companyId, moduleId });
            } else {
                await activateModule({ companyId, moduleId });
            }
            setIsActive(!isActive); // Update local state
        } catch (error) {
            console.error("Error toggling module activation", error);
        }
    };

    return (
        <div className="relative flex flex-col sm:flex-row max-w-full sm:max-w-3xl items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
            <Switch
                id={id}
                className="order-1 h-6 w-10 after:absolute after:inset-0 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-4 rtl:[&_span]:data-[state=checked]:-translate-x-4"
                aria-describedby={`${id}-description`}
                checked={isActive}
                onCheckedChange={handleToggle}
            />
            <div className="flex items-center justify-center h-20 w-20">
                <div
                    className="flex size-16 shrink-0 items-center justify-center rounded-full border border-border"
                    aria-hidden="true"
                >
                    <Package className="opacity-60" size={48} strokeWidth={2} /> {/* Increase size */}
                </div>
            </div>
            <div className="grid grow">
                <h2 className="scroll-m-20 p-1 text-3xl font-semibold tracking-tight first:mt-0">
                    {title}
                </h2>
                <p className="text-xs text-muted-foreground mb-2">{formatDate(createdAt)}</p>
                <div className="flex flex-wrap space-x-1 mb-2">
                    {categories.map((category, index) => (
                        <Badge key={index}>{category}</Badge>
                    ))}
                </div>
                <p id={`${id}-description`} className="text-sm text-muted-foreground mt-2">
                    {description}
                </p>
                <div className="flex justify-end mt-2 w-full">
                    <div className="flex items-center rounded-full border border-border bg-background p-1 shadow shadow-black/5">
                        <p className="px-2 text-xs text-muted-foreground">
                            Activated by <strong className="font-medium text-foreground">{activationCount}</strong> {activationCount === 1 ? 'Company' : 'Companies'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
"use client";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card } from "@/components/ui/card";

export default function Test() {


    return (
        <AdminPanelLayout >
            <ContentLayout title="dashboard">
                <Card className="w-96 h-64 border rounded-lg shadow-lg flex justify-center items-center">
                    Hello from Admin
                </Card>
                
            </ContentLayout>
        </AdminPanelLayout>

    );
}

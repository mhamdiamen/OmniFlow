// components/AcceptInvitePage.js
import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

export default function AcceptInvitePage() {
    const router = useRouter();
    const { token } = router.query;
    const [loading, setLoading] = useState(false);

    const handleAcceptInvitation = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/accept-invitation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const result = await response.json();
            if (response.ok) {
                alert("Invitation accepted successfully!");
                router.push("/dashboard"); // Redirect to the dashboard
            } else {
                alert("Failed to accept invitation: " + result.error);
            }
        } catch (error) {
            alert("An error occurred while accepting the invitation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4" >
            <h2 className="text-lg font-semibold" > Accept Invitation </h2>
            < Button onClick={handleAcceptInvitation} className="w-40" disabled={loading} >
                {loading ? "Accepting..." : "Accept Invitation"}
            </Button>
        </div>
    );
}
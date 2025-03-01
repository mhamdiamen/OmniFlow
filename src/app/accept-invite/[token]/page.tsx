"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation"; // ✅ Import `useParams()`
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "../../../../convex/_generated/api";

export default function AcceptInvitePage() {
  const params = useParams(); // ✅ Unwrap params
  const token = params?.token as string; // ✅ Extract token safely
  const router = useRouter();
  const acceptInvite = useMutation(api.mutations.invitiations.acceptInvitation);
  const [status, setStatus] = useState<"loading" | "success" | "error" | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    acceptInvite({ token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token, acceptInvite]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      {status === "loading" && <p>Processing invitation...</p>}
      {status === "success" && <p>✅ Invitation accepted! You have joined the company.</p>}
      {status === "error" && <p>❌ Invalid or expired invitation.</p>}

      <Button onClick={() => router.push("/")} className="mt-4">
        Go to Dashboard
      </Button>
    </div>
  );
}

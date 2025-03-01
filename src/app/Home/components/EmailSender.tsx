import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function EmailSender() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!email) {
      alert("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Email sent successfully!");
      } else {
        alert("Failed to send email: " + result.error);
      }
    } catch (error) {
      alert("An error occurred while sending the email.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-lg font-semibold">Send Test Email</h2>
      <Input
        type="email"
        placeholder="Enter user email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-80"
        disabled={loading}
      />
      <Button onClick={handleSendEmail} className="w-40" disabled={loading}>
        {loading ? "Sending..." : "Send Email"}
      </Button>


    </div>
  );
}
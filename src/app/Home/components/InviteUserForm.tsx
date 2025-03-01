"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Send, Loader2 } from "lucide-react";

// Define the form schema with validation
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type FormValues = z.infer<typeof formSchema>;

interface InviteUserFormProps {
  companyId: Id<"companies">;
  invitedBy: Id<"users">;
}

export default function InviteUserForm({ companyId, invitedBy }: InviteUserFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const inviteUser = useMutation(api.mutations.invitiations.inviteUser);

  // Initialize form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSendInvitation = async (values: FormValues) => {
    setLoading(true);
    try {
      const token = crypto.randomUUID();

      // Invite the user through Convex
      await inviteUser({
        email: values.email,
        companyId,
        invitedBy,
        token,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });

      // Send the email with the token
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, token }),
      });

      const result = await response.json();
      if (response.ok) {
        toast({
          title: "Invitation Sent",
          description: `An invitation has been sent to ${values.email}`,
          variant: "default",
        });
        form.reset();
      } else {
        toast({
          title: "Error",
          description: `Failed to send email: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending the invitation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-2 pb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSendInvitation)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1 w-[75%]">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="colleague@company.com" 
                        className="pl-10" 
                        {...field}
                        disabled={loading}
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="whitespace-nowrap w-[25%]">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          The user will receive an email with instructions to join your company.
          The invitation will expire after 24 hours.
        </p>
      </div>
    </div>
  );
}

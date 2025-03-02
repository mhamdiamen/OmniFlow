"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Define the form schema
const formSchema = z.object({
  email: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface InviteUserFormProps {
  companyId: Id<"companies">;
  invitedBy: Id<"users">;
}

export default function InviteUserForm({ companyId, invitedBy }: InviteUserFormProps) {
  const [loading, setLoading] = useState(false);
  const inviteUser = useMutation(api.mutations.invitiations.inviteUser);

  // Initialize form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSendInvitation = async (values: FormValues) => {
    // Set loading state
    setLoading(true);
    
    // Create a promise that handles the invitation process
    const invitationPromise = async () => {
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

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Failed to send invitation email");
        }

        // Reset form on success
        form.reset();
        return values.email; // Return email to use in success message
      } catch (error) {
        // Log error for debugging
        console.error("Invitation error:", error);
        // Rethrow to be caught by toast.promise error handler
        throw error;
      }
    };

    // Use toast.promise without catch
    toast.promise(invitationPromise(), {
      loading: "Sending invitation to " + values.email,
      success: (email) => {
        setLoading(false);
        return `Invitation sent to ${email} successfully!`;
      },
      error: (error) => {
        setLoading(false);
        // Extract error message
        const errorMessage = error?.message || "An unknown error occurred";
        
        // Handle specific error cases
        if (errorMessage.includes("User not found")) {
          return "User not found. The email address is not associated with any user.";
        } else if (errorMessage.includes("User already belongs to a company")) {
          return "User already belongs to this or another company and cannot be invited.";
        } else if (errorMessage.includes("Invalid or expired invitation")) {
          return "Invalid invitation. The invitation is invalid or has expired.";
        } else if (errorMessage.includes("Invitation has expired")) {
          return "Invitation expired. Please create a new invitation.";
        } else if (errorMessage.includes("Failed to send invitation email")) {
          return "The invitation was created but we couldn't send the email.";
        } else {
          // Generic error message for other cases
          return errorMessage;
        }
      },
    });
  };

  // Handle form submission with validation
  const onSubmit = (values: FormValues) => {
    // Check if email is empty
    if (!values.email.trim()) {
      toast.error("Email required", {
        description: "Please enter an email address.",
        duration: 5000,
      });
      return;
    }
    
    // Validate email format
    if (!z.string().email().safeParse(values.email).success) {
      toast.error("Invalid email format", {
        description: "Please enter a valid email address.",
        duration: 5000,
      });
      return;
    }
    
    // If validation passes, proceed with sending invitation
    handleSendInvitation(values);
  };

  return (
    <div className="space-y-4 py-2 pb-4">
      <Form {...form}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const emailValue = form.getValues().email;
            
            // Check if email is empty
            if (!emailValue.trim()) {
              toast.error("Email required", {
                description: "Please enter an email address.",
                duration: 5000,
              });
              return;
            }
            
            // Set loading state before starting the promise
            setLoading(true);
            
            // Continue with form submission if not empty
            form.handleSubmit(onSubmit)(e);
          }} 
          className="space-y-4"
        >
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

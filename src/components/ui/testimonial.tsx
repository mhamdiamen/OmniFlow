"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TestimonialProps extends React.HTMLAttributes<HTMLDivElement> {
  companyLogo?: string;
  quote: string;
  authorName: string;
  authorPosition: string;
  authorImage?: string;
  highlightedText?: string;
  teamMembers?: Array<{
    _id: string;
    name?: string;
    email?: string;
    image?: string;
  }>;
}

export const Testimonial = React.forwardRef<HTMLDivElement, TestimonialProps>(
  ({ 
    className, 
    companyLogo,
    quote,
    authorName,
    authorPosition,
    authorImage,
    highlightedText,
    teamMembers,
    ...props 
  }, ref) => {
    const formattedQuote = highlightedText
      ? quote.replace(
          highlightedText,
          `<strong class="font-semibold">${highlightedText}</strong>`
        )
      : quote;

    return (
      <div
        ref={ref}
        className={cn("py-16", className)}
        {...props}
      >
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center">
            {companyLogo && (
              <div className="mb-7 relative h-8 w-32">
                <Image
                  src={companyLogo}
                  alt="Company logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <p 
              className="max-w-xl text-balance text-center text-xl sm:text-2xl text-foreground"
              dangerouslySetInnerHTML={{ __html: `"${formattedQuote}"` }}
            />
            <h5 className="mt-5 font-medium text-muted-foreground">
              {authorName}
            </h5>
            <h5 className="mt-1.5 font-medium text-foreground/40">
              {authorPosition}
            </h5>
            {authorImage && (
              <div className="mt-5 relative size-12 rounded-full overflow-hidden bg-muted">
                <Image
                  src={authorImage}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            {/* Team Members Avatars */}
            {teamMembers && teamMembers.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-xs font-medium">Team Members</span>
                </div>
                <div className="flex -space-x-2 justify-center">
                  {teamMembers.slice(0, 3).map((member) => (
                    <Avatar key={member._id} className="h-8 w-8 border-2 border-background">
                      {member.image ? (
                        <AvatarImage
                          src={member.image}
                          alt={member.name || ''}
                          onError={(e) => {
                            // If image fails to load, hide it so fallback shows
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <AvatarFallback>
                        {member.email?.[0]?.toUpperCase() || member.name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {teamMembers.length > 3 && (
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium border-2 border-background">
                      +{teamMembers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Testimonial.displayName = "Testimonial";
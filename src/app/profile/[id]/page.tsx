"use client";

import { useRouter, useParams } from "next/navigation";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, MoreHorizontal, MessageCircle, Calendar, Building, Building2, University, GraduationCap, Briefcase, BriefcaseBusiness, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as Id<"users">;

    const user = useQuery(api.queries.users.getUserById, { userId });

    if (!user) {
        return (
            <AdminPanelLayout>
                <ContentLayout title="Profile">
                    <div>Loading...</div>
                </ContentLayout>
            </AdminPanelLayout>
        );
    }

    return (
        <AdminPanelLayout>
            <ContentLayout title="Profile">
                {/* Banner and Avatar Section */}
                <div className="relative w-full h-64  rounded-lg">
                    <img src="/banner.jpg" alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute -bottom-28 left-6 flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar className="h-32 w-32 border-4 rounded-full ">
                                <AvatarImage src={user.image} alt={user.name || user.email} />
                                <AvatarFallback>
                                    {(user.name || user.email).charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {user.invitationStatus === "accepted" && (
                                <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1 border-2 ">
                                    <BadgeCheck className="h-5 w-5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div>
                            <div className="text-4xl font-bold">{user.name || "N/A"}</div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end mt-6 space-x-2">
                    <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>
                    <Button variant="outline">
                        <MessageCircle className="h-5 w-5 mr-2" /> Message
                    </Button>
                </div>

                {/* Quote (if exists) */}
                {user.quote && (
                    <div className="flex justify-end mt-10">
                        <blockquote className="border-l-2 pl-6 italic">
                            "{user.quote}"
                        </blockquote>
                    </div>
                )}

                <Separator className="my-8" />

                {/* About Me Section */}
                <div className="grid grid-cols-2 gap-8"> {/* Grid for About Me and other sections */}
                    <div>
                        <h3 className="mb-2 text-2xl font-semibold tracking-tight flex items-center">
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted">
                                <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <span className="ml-2">About Me</span>
                        </h3>
                        <small className="text-sm font-medium leading-none">{user.bio || "No bio yet."}</small>

                    </div>

                    {/* Location, Website, Portfolio, Email (grouped in a card) */}
                    <div className="grid grid-cols-2 gap-4"> {/* Inner grid for fields */}
                        {/* Skills and Certifications */}
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">Skills</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {user.skills && user.skills.map((skill, index) => (
                                    <Badge key={index}>{skill}</Badge>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">Certifications</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {user.certifications && user.certifications.map((cert, index) => (
                                    <Badge key={index} variant="secondary">{cert}</Badge>
                                ))}
                            </div>
                        </div>

                        {/* Move Phone below Skills and Certifications */}
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <div className="flex items-center mt-1">
                                <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                                <small className="text-sm font-medium leading-none">
                                    <span className="font-bold">+216</span> {user.phone || "N/A"}
                                </small>
                            </div>
                        </div>


                    </div>
                </div>


                <Separator className="my-8" />

                {/* Experience Section */}
                {user.experience && user.experience.length > 0 && (
                    <div className="mt-10">
                        <h3 className="text-2xl font-semibold tracking-tight flex items-center">
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted">
                                <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <span className="ml-2">Experience</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {user.experience.map((exp, index) => (
                                <Card key={index} className="shadow h-full flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold">
                                            {exp.title}
                                        </CardTitle>
                                        <small className="text-sm font-medium leading-none flex items-center">
                                            <Building2 className="h-4 w-4 mr-2" />
                                            {exp.company}
                                        </small>

                                    </CardHeader>
                                    <CardContent className="flex-grow flex flex-col">
                                        {exp.description && (
                                            <small className=" text-sm font-medium leading-none">{exp.description}</small>
                                        )}
                                        <p className="mt-4 text-sm text-muted-foreground flex items-center">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {new Date(exp.startDate).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"}
                                        </p>

                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education Section */}
                {user.education && user.education.length > 0 && (
                    <div className="mt-10">
                        <h3 className="text-2xl font-semibold tracking-tight flex items-center">
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted">
                                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <span className="ml-2">Education</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
                            {user.education.map((edu, index) => (
                                <Card key={index} className="shadow h-full flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold">
                                            <span className="font-bold">{edu.degree} </span>
                                            {/*                                             <span className="font-bold"> in {edu.fieldOfStudy}</span>
 */}                                        </CardTitle>

                                        <small className="text-sm font-medium leading-none flex items-center">
                                            <University className="h-4 w-4 mr-2" />
                                            {edu.institution}
                                        </small>

                                    </CardHeader>

                                    <CardContent className="flex-grow flex flex-col">
                                        <p className="text-sm text-muted-foreground flex items-center">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {new Date(edu.startDate * 1000).toLocaleDateString()} - {edu.endDate ? new Date(edu.endDate * 1000).toLocaleDateString() : "Present"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

            </ContentLayout>
        </AdminPanelLayout>
    );

}

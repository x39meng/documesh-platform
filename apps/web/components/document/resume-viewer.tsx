
"use client";

import { useSelection } from "@/context/selection-context";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { type Resume } from "@repo/core/schemas/resume";

import { Briefcase, GraduationCap, Code2, MapPin, Mail, Phone, Globe, Linkedin, Github } from "lucide-react";

interface ResumeViewerProps {
  data: Resume;
}

export function ResumeViewer({ data }: ResumeViewerProps) {
  const { setHighlightedBbox } = useSelection();

  // Helper to handle hover
  const onHover = (bbox?: number[] | null) => {
    if (bbox && Array.isArray(bbox) && bbox.length === 4) {
      setHighlightedBbox(bbox);
    } else {
      setHighlightedBbox(null);
    }
  };

  if (!data) return <div className="p-8 text-center text-muted-foreground">No data available</div>;

  return (
    <div className="p-6 space-y-6 pb-20">
      {/* Header Section */}
      <Card 
        className="border-none bg-gradient-to-br from-indigo-500/10 via-background to-background"
        onMouseEnter={() => onHover(data.nameBbox)}
        onMouseLeave={() => onHover(null)}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{data.fullName || "Unknown Candidate"}</h1>
              <p className="text-xl text-primary font-medium mt-1">{data.headline}</p>
              
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {data.location?.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{data.location.city}, {data.location.country}</span>
                  </div>
                )}
                {data.contactEmail && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{data.contactEmail}</span>
                  </div>
                )}
                {data.phoneNumber && (
                   <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{data.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Socials */}
            <div className="flex gap-2">
                {data.socialProfiles?.map((profile, idx) => {
                    const network = profile.network?.toLowerCase() || "";
                    let Icon = Globe;
                    if (network.includes("linkedin")) Icon = Linkedin;
                    if (network.includes("github")) Icon = Github;
                    
                    return (
                        <a key={idx} href={profile.url} target="_blank" rel="noreferrer" className="p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">
                            <Icon className="w-4 h-4 text-foreground" />
                        </a>
                    );
                })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold">Experience</h2>
        </div>
        <div className="space-y-4">
            {data.workExperience?.map((exp, i) => (
                <Card 
                    key={i} 
                    className="hover:border-primary/50 transition-colors cursor-default group"
                    onMouseEnter={() => onHover(exp.bbox)} // Assuming bbox might exist on generic blocks
                    onMouseLeave={() => onHover(null)}
                >
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">{exp.jobTitle}</CardTitle>
                                <div className="text-base font-medium text-muted-foreground">{exp.companyName}</div>
                            </div>
                            <div className="text-sm font-medium bg-secondary px-3 py-1 rounded-full">
                                {exp.startDate} - {exp.isCurrentRole ? "Present" : exp.endDate}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-muted-foreground/90">
                            {exp.responsibilities?.map((resp: string, j: number) => (
                                <li key={j}>{resp}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}
        </div>
      </section>

      {/* Skills & Education Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills */}
          <section>
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Code2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold">Skills</h2>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                        {data.technicalSkills?.map((skill: string, i: number) => (
                            <Badge key={i} variant="secondary" className="hover:bg-primary/20 transition-colors">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </section>

          {/* Education */}
          <section>
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold">Education</h2>
            </div>
             <div className="space-y-3">
                {data.education?.map((edu, i) => (
                    <Card 
                        key={i}
                        className="hover:border-primary/50 transition-colors cursor-default"
                        onMouseEnter={() => onHover(edu.bbox)}
                        onMouseLeave={() => onHover(null)}
                    >
                        <CardContent className="pt-4">
                            <div className="font-semibold text-foreground">{edu.institution}</div>
                            <div className="text-sm text-primary">
                                {edu.degree}
                                {edu.fieldOfStudy && <span className="text-muted-foreground"> in {edu.fieldOfStudy}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{edu.startDate} - {edu.endDate}</div>
                        </CardContent>
                    </Card>
                ))}
             </div>
          </section>
      </div>
    </div>
  );
}

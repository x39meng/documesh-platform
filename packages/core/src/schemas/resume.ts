import { z } from "zod";

const DATE_DESC =
  "Date in YYYY-MM format (e.g., '2023-05'). Return null if not present.";

// Zod Schema for both validation and Gemini API calls
export const ResumeSchema = z.object({
  fullName: z.string().describe("Full name of the candidate"),
  nameBbox: z
    .array(z.number())

    .describe("Box [x1, y1, x2, y2] (0-1000). x1=left, y1=top."),
  headline: z
    .string()
    .optional()
    .describe("Professional title or headline. Should be at most 2 sentences. Rephrase if too long. If missing, write one."),
  contactEmail: z.string().email().optional().describe("Email address"),
  phoneNumber: z.string().optional().describe("Phone number"),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional()
    .describe("Location information"),
  socialProfiles: z
    .array(
      z.object({
        network: z
          .string()
          .describe("e.g., 'LinkedIn', 'GitHub', 'Personal Website'"),
        url: z.string().describe("URL to the profile"),
        username: z
          .string()
          .optional()
          .nullable()
          .describe("Username on the platform"),
      })
    )
    .optional()
    .describe("Links to LinkedIn, GitHub, Portfolio, or personal websites"),

  workExperience: z
    .array(
      z.object({
        jobTitle: z.string().optional().describe("Job title or position"),
        companyName: z.string().optional().describe("Company name"),
        location: z.string().optional().describe("Job location"),
        startDate: z.string().optional().nullable().describe(DATE_DESC),
        endDate: z.string().optional().nullable().describe(DATE_DESC),
        isCurrentRole: z
          .boolean()
          .optional()
          .describe("Is this the current role?"),
        responsibilities: z
          .array(z.string())
          .optional()
          .describe("List of responsibilities and achievements"),
        technologiesUsed: z
          .array(z.string())
          .optional()
          .describe("Technologies and tools used"),
        bbox: z
          .array(z.number())
          .optional()
          .describe("Box [x1, y1, x2, y2] (0-1000)."),
      })
    )
    .optional()
    .describe("Work experience history"),

  education: z
    .array(
      z.object({
        institution: z.string().optional().describe("University name"),
        degree: z
          .string()
          .optional()
          .describe("Degree Only (e.g. 'Bachelor of Science', 'B.A.')"),
        fieldOfStudy: z
          .string()
          .optional()
          .describe("Major/Subject Only (e.g. 'Computer Science')"),
        startDate: z.string().optional().nullable().describe(DATE_DESC),
        endDate: z.string().optional().nullable().describe(DATE_DESC),
        gpa: z.string().optional().describe("GPA if mentioned"),
        bbox: z
          .array(z.number())
          .optional()
          .describe(
            "Bounding box [x1, y1, x2, y2] normalized to 1000. Covers the entire section."
          ),
      })
    )
    .optional()
    .describe("Educational background"),

  technicalSkills: z
    .array(z.string())
    .optional()
    .describe("Technical skills and tools"),
  softSkills: z
    .array(z.string())
    .optional()
    .describe("Soft skills and competencies"),
  languages: z
    .array(
      z.object({
        language: z.string().describe("Language name"),
        proficiency: z.string().optional().describe("Proficiency level"),
      })
    )
    .optional()
    .describe("Languages spoken"),

  projects: z
    .array(
      z.object({
        name: z.string().optional().describe("Project name"),
        description: z.string().optional().describe("Project description"),
        url: z.string().optional().describe("Project URL or repository"),
        technologies: z
          .array(z.string())
          .optional()
          .describe("Technologies used in the project"),
      })
    )
    .optional()
    .describe("Notable projects"),

  visualMetaAnalysis: z
    .object({
      hasHeadshot: z
        .boolean()
        .optional()
        .describe("Does the resume include a profile photo?"),
      hasQrCode: z
        .boolean()
        .optional()
        .describe("Does the resume include a QR code?"),
      pageCount: z
        .number()
        .optional()
        .describe("Number of pages in the resume"),
      documentVibe: z
        .string()
        .optional()
        .describe("e.g., 'modern', 'academic', 'creative', 'traditional'"),
      perceivedEthnicity: z
        .string()
        .optional()
        .describe("Visual estimation of ethnicity from photo"),
      confidenceReasoning: z
        .string()
        .optional()
        .describe("Reasoning for the estimation"),
      layoutIssues: z
        .array(z.string())
        .optional()
        .describe("Any layout or formatting issues detected"),
      isScanned: z
        .boolean()
        .optional()
        .describe("Is this a scanned document vs. digitally created?"),
    })
    .optional()
    .describe("Visual and layout analysis of the resume"),

  redFlags: z
    .array(z.string())
    .optional()
    .describe(
      "Any concerning patterns like employment gaps, typos, or inconsistencies"
    ),

  unmappedInformation: z
    .string()
    .optional()
    .describe("Any text that doesn't fit the schema but seems important"),
});

export type Resume = z.infer<typeof ResumeSchema>;

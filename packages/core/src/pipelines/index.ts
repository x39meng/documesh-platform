import { ResumeSchema } from "@repo/core/schemas/resume";
import { InvoiceSchema } from "@repo/core/schemas/invoice";
import { z } from "zod";

export const PipelineSchema = z.object({
  type: z.enum(["RESUME", "INVOICE"]),
  schema: z.any(), // ZodSchema/ZodType
  model: z.string(),
  systemPrompt: z.string(),
  extractionPrompt: z.string(),
});

export type Pipeline = z.infer<typeof PipelineSchema>;

export const PIPELINES = {
  RESUME: {
    "resume-v1.0.0": {
      type: "RESUME",
      schema: ResumeSchema,
      model: "gemini-2.5-flash",
      systemPrompt: `You are an expert technical recruiter. `,
      extractionPrompt: `Analyze this resume PDF.
VISUAL ANALYSIS TASKS:
1. Look for a profile picture. Set 'visualMetaAnalysis.hasHeadshot' accordingly.
2. Analyze the layout. Is it a dense academic CV or a modern 2-column design?
EXTRACTION TASKS:
1. Extract candidate details, work experience, and education.
2. Normalize all dates to "YYYY-MM" format.
3. Infer skills based on job descriptions.
4. COORDINATES: All BBoxes must be [x1, y1, x2, y2] (0-1000). x1 is the left edge.
5. EDUCATION: Split "Bachelor of Science in CS" -> Degree="Bachelor of Science", Field="CS".
Extract the data matching the schema.`,
    },
  },
  INVOICE: {
    "invoice-v1.0.0": {
      type: "INVOICE",
      schema: InvoiceSchema,
      model: "gemini-2.5-flash",
      systemPrompt: `You are a forensic accountant. Analyze this invoice PDF.`,
      extractionPrompt: `VISUAL ANALYSIS TASKS:
1. Look for company logos and branding.
2. Assess document quality (digital vs. scanned).
EXTRACTION TASKS:
1. Extract vendor details, invoice number, and dates.
2. Extract all line items with precise math.
3. Verify that subtotal + tax = total.
4. Identify any red flags like math errors or missing information.
Extract invoice data matching the schema.`,
    },
  },
} as const;

export type DocumentType = keyof typeof PIPELINES;
export type PipelineVersion =
  | keyof typeof PIPELINES.RESUME
  | keyof typeof PIPELINES.INVOICE;

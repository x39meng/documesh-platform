import { z } from "zod";

const DATE_DESC = "Date in YYYY-MM-DD format (e.g., '2024-01-15')";

// Zod Schema for both validation and Gemini API calls
export const InvoiceSchema = z.object({
  invoiceNumber: z.string().describe("Invoice number or ID"),

  date: z.string().describe(DATE_DESC + " - Invoice issue date"),

  dueDate: z
    .string()
    .optional()
    .describe(DATE_DESC + " - Payment due date"),

  vendor: z
    .object({
      name: z.string().describe("Vendor/supplier company name"),
      address: z.string().optional().describe("Vendor address"),
      taxId: z.string().optional().describe("Vendor tax ID or VAT number"),
      email: z.string().optional().describe("Vendor contact email"),
      phone: z.string().optional().describe("Vendor contact phone"),
    })
    .describe("Vendor/supplier information"),

  customer: z
    .object({
      name: z.string().describe("Customer/buyer company name"),
      address: z.string().optional().describe("Customer billing address"),
      taxId: z.string().optional().describe("Customer tax ID"),
      email: z.string().optional().describe("Customer contact email"),
    })
    .optional()
    .describe("Customer/buyer information"),

  lineItems: z
    .array(
      z.object({
        description: z.string().describe("Item or service description"),
        quantity: z.number().describe("Quantity ordered"),
        unitPrice: z.number().describe("Price per unit"),
        amount: z
          .number()
          .describe("Total amount for this line (quantity × unitPrice)"),
        taxRate: z
          .number()
          .optional()
          .describe("Tax rate percentage for this item"),
      })
    )
    .describe("List of invoice line items"),

  subtotal: z.number().describe("Subtotal before tax"),

  tax: z.number().describe("Total tax amount"),

  total: z.number().describe("Final total amount (subtotal + tax)"),

  currency: z
    .string()
    .default("USD")
    .describe("Currency code (e.g., USD, EUR, GBP)"),

  paymentTerms: z.string().optional().describe("Payment terms or conditions"),

  notes: z
    .string()
    .optional()
    .describe("Additional notes or comments on the invoice"),

  visualMetaAnalysis: z
    .object({
      hasLogo: z
        .boolean()
        .optional()
        .describe("Does the invoice include a company logo?"),
      pageCount: z
        .number()
        .optional()
        .describe("Number of pages in the invoice"),
      documentQuality: z
        .string()
        .optional()
        .describe("e.g., 'high', 'medium', 'low', 'scanned'"),
      layoutIssues: z
        .array(z.string())
        .optional()
        .describe("Any layout or formatting issues detected"),
    })
    .optional()
    .describe("Visual and layout analysis of the invoice"),

  redFlags: z
    .array(z.string())
    .optional()
    .describe(
      "Any concerning patterns like math errors, missing information, or inconsistencies"
    ),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

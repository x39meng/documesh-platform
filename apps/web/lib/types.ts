import { SelectSubmissionSchema } from "@repo/database";
import { z } from "zod";

const DateIsoCodec = z.codec(z.date(), z.string(), {
  decode: (date) => date.toISOString(),
  encode: (iso) => new Date(iso),
});

export const PublicSubmissionSchema = SelectSubmissionSchema.extend({
  createdAt: DateIsoCodec,
  hasData: z.boolean().optional(),
});

export type PublicSubmission = z.infer<typeof PublicSubmissionSchema>;

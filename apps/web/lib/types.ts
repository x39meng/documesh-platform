import { z } from "zod";

import { SelectSubmissionSchema } from "@repo/database";

// Codec: Date <-> ISO String
const DateIsoCodec = z.codec(z.date(), z.string(), {
  decode: (date) => date.toISOString(), // Server -> Client
  encode: (iso) => new Date(iso), // Client -> Server
});

export const PublicSubmissionSchema = SelectSubmissionSchema.extend({
  createdAt: DateIsoCodec,
  hasData: z.boolean().optional(),
});

export type PublicSubmission = z.output<typeof PublicSubmissionSchema>;

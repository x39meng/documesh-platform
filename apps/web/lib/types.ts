import { z } from "zod";

import {
  SelectSubmissionSchema,
  SelectAgentConversationSchema,
  SelectAgentMessageSchema,
} from "@repo/database";

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

// Agent Conversation DTOs
export const PublicAgentConversationSchema =
  SelectAgentConversationSchema.extend({
    createdAt: DateIsoCodec,
    updatedAt: DateIsoCodec,
  });

export type PublicConversation = z.output<typeof PublicAgentConversationSchema>;

// Agent Message DTOs
export const PublicAgentMessageSchema = SelectAgentMessageSchema.extend({
  createdAt: DateIsoCodec,
});

export type PublicMessage = z.output<typeof PublicAgentMessageSchema>;

// Conversation with messages (composite type)
export type ConversationWithMessages = PublicConversation & {
  messages: PublicMessage[];
};

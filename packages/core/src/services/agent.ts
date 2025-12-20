import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "@repo/config";
import { createLogger } from "@repo/core/lib/logger";
import { generateText, tool } from "ai";
import { z } from "zod";
import { ResumeSchema } from "@repo/core/schemas/resume";
import { handleGetResumeDetails } from "./agent-tools/get-resume-details";
import { handleQueryDatabase } from "./agent-tools/query-database";

const logger = createLogger("agent-service");

// Initialize Google AI with API Key
const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

export interface AgentMessage {
  role: "user" | "model" | "tool";
  parts: {
    text?: string;
  }[];
}

export const AgentService = {
  async *chat(
    message: string,
    history: AgentMessage[],
    orgId: string
  ): AsyncGenerator<string, void, unknown> {
    const requestId = crypto.randomUUID();
    const chatStartTime = Date.now();

    logger.info(
      {
        requestId,
        messageLength: message.length,
        historyCount: history.length,
      },
      "Starting chat with Agent (Stream - AI SDK)"
    );

    // Convert history to CoreMessages
    const messages: any[] = history
      .filter((h) => h.role === "user" || h.role === "model") // Simple filter for text-only history from frontend
      .map((h) => ({
        role: h.role === "model" ? "assistant" : "user",
        content: h.parts.map((p) => p.text).join(""),
      }));

    messages.push({ role: "user", content: message });

    // Manual multi-step loop since automatic continuation isn't working
    let currentMessages = [...messages];
    const maxSteps = 20;

    for (let step = 0; step < maxSteps; step++) {
      logger.info(
        { step, messageCount: currentMessages.length, requestId },
        "Agent step starting"
      );

      const result = await generateText({
        model: google("gemini-2.5-flash"),
        messages: currentMessages,
        system: `You are the Documesh AI Assistant, a powerful analytics and search agent for the Documesh Platform.

**IMPORTANT: Format all responses using Markdown**

Use these formatting guidelines:
- **Tables**: Use markdown tables for data (| Header 1 | Header 2 |)
- **Lists**: Use - or 1. for lists
- **Code**: Use \`inline code\` for SQL/tech terms, \`\`\`sql for code blocks
- **Emphasis**: Use **bold** for important findings, *italic* for notes
- **Numbers**: Format large numbers with commas (e.g., 1,234)

Example response format:
"""
📊 Here are the top technical skills:

| Skill | Count | Percentage |
|-------|-------|------------|
| React | 15 | 45% |
| Python | 12 | 36% |

**Key Insights:**
- React and Python dominate the skillset
- Strong focus on web development
"""

Available Tools:
1. **queryDatabase**: Execute full SQL SELECT queries on the submissions table
   - Use for analytics, aggregations, filtering
   - All queries automatically scoped to user's organization
   - Examples: aggregations, JOINs, JSON operations, window functions
   - PostgreSQL with full JSONB operator support (\`->\`, \`->>\`, \`?\`, \`?|\`, \`@>\`)
   - Limits: 100 rows, 5-second timeout
   - Use \`LATERAL jsonb_array_elements\` for unnesting arrays

2. **getResumeDetails**: Get full details of a specific resume by ID
   - Use when user asks about a specific document
   - Returns complete resume data including skills, experience, education

Security: All database queries are automatically filtered to the user's organization. You have read-only access.

Guidelines:
- Always use markdown tables for structured data
- Include **key insights** after showing data
- When showing SQL in responses, use \`\`\`sql code blocks
- Be concise but informative
- If data shows interesting patterns, highlight them in **bold**

🗄️ DATABASE SCHEMA:

**submissions** table:
- \`id\`: UUID (primary key)
- \`org_id\`: UUID (auto-filtered to user's org - don't include in WHERE)
- \`document_type\`: TEXT ('RESUME', 'INVOICE', etc.)
- \`status\`: ENUM ('pending', 'processing', 'completed', 'failed')
- \`final_data\`: JSONB (structured resume/document data - see schema below)
- \`created_at\`: TIMESTAMP
- \`file_key\`, \`pipeline_version\`, \`raw_extraction\`: metadata

**Resume Data Structure** (in \`final_data\` JSONB field):
${JSON.stringify((z as any).toJSONSchema(ResumeSchema), null, 2)}

🎨 RESPONSE FORMATTING:
- Use Markdown with **bold** for key metrics and names
- Use tables for comparisons, bullets for lists
- Add contextual emojis (📊 📈 👥 🎓 💼)
- Always provide insights/summary after presenting data

⚠️ CRITICAL RULES:
1. **NEVER hallucinate data** - Only use tool results
2. **ALWAYS explain findings** - Interpret, don't just dump data
3. **Write efficient queries** - Use LIMIT, avoid expensive operations
4. **Handle errors gracefully** - Simplify and retry if query fails`,
        tools: {
          getResumeDetails: tool({
            description:
              "Get detailed information about a specific resume/submission using its ID.",
            parameters: z.object({
              id: z.string().describe("The ID of the submission/resume."),
            }),
            execute: async (args: any) =>
              handleGetResumeDetails(args, orgId, requestId),
          } as any),
          queryDatabase: tool({
            description:
              "Execute a full read-only SQL SELECT query against the submissions table. Use this for analytics, aggregations, filtering, and complex queries on resumes and invoices. All queries are automatically scoped to the user's organization. Examples: 'SELECT COUNT(*) FROM submissions', 'SELECT final_data->>'name' FROM submissions WHERE document_type = 'RESUME'', 'SELECT skill, COUNT(*) FROM submissions, jsonb_array_elements_text(final_data->'technicalSkills') as skill GROUP BY skill ORDER BY count DESC'.",
            parameters: z.object({
              query: z
                .string()
                .describe(
                  "The complete SQL SELECT query to execute. Must reference the submissions table. Security: Only SELECT queries allowed, automatically scoped to user's organization, 5-second timeout, 100-row limit."
                ),
            }),
            execute: async (args: any) =>
              handleQueryDatabase(args, orgId, requestId),
          } as any),
        },
        toolChoice: "auto",
      });

      logger.info(
        {
          step,
          finishReason: result.finishReason,
          toolCalls: result.toolCalls?.length || 0,
          hasText: !!result.text,
          textLength: result.text?.length || 0,
          requestId,
        },
        "Agent step finished"
      );

      // If model generated text, yield it and break
      if (result.text) {
        logger.info(
          { step, textLength: result.text.length, requestId },
          "Yielding text to client"
        );

        // Split into words and yield progressively for better streaming UX
        const words = result.text.split(" ");
        for (let i = 0; i < words.length; i++) {
          yield words[i] + (i < words.length - 1 ? " " : "");
        }

        const chatDuration = Date.now() - chatStartTime;
        logger.info(
          {
            step,
            finishReason: result.finishReason,
            duration: chatDuration,
            requestId,
          },
          "Chat completed with text"
        );
        break;
      }

      // If model called tools, add tool results to messages and continue
      if (result.toolCalls && result.toolCalls.length > 0) {
        // Build the messages from response.messages which includes proper format
        currentMessages = [...currentMessages, ...result.response.messages];
        logger.info(
          { step, toolCallCount: result.toolCalls.length, requestId },
          "Continuing after tool calls"
        );

        // If we're about to hit max steps, force one more iteration to generate text
        if (step >= maxSteps - 2) {
          logger.warn(
            { step, maxSteps, requestId },
            "Approaching max steps after tool call - will force text generation on next iteration"
          );
        }
        continue;
      }

      // If neither text nor tool calls, something went wrong
      logger.warn(
        { step, finishReason: result.finishReason, requestId },
        "Unexpected state - no text or tool calls generated"
      );
      break;
    }

    // If we exited the loop without generating text, provide a fallback response
    if (currentMessages.length > 0) {
      logger.warn(
        { maxSteps, finalMessageCount: currentMessages.length, requestId },
        "Reached max steps without generating final text response"
      );
      yield "I've processed your request using the available tools, but I reached my step limit before generating a complete response. Please try asking your question in a simpler way or break it into smaller parts.";
    }

    const totalDuration = Date.now() - chatStartTime;
    logger.info(
      { requestId, totalDuration, finalSteps: maxSteps },
      "Chat stream completed"
    );
  },
};

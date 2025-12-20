"use server";

import { AgentService, AgentConversationService } from "@repo/core";
import { auth, MembershipRepository } from "@repo/core";
import { headers } from "next/headers";
import { createStreamableValue } from "ai/rsc";
import { createLogger } from "@repo/core/lib/logger";

const logger = createLogger("ai-action");

import type { AgentMessage } from "@repo/core/services/agent";

export async function chatWithAgent(
  message: string,
  history: AgentMessage[],
  conversationId?: string | null,
  persistUserMessage: boolean = true
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const membership = await MembershipRepository.findByUserId(session.user.id);
  const orgId = membership?.orgId;

  if (!orgId) {
    return { success: false, error: "No organization found for user" };
  }

  const stream = createStreamableValue("");
  let agentResponse = "";
  let chunkCount = 0;
  const streamStartTime = Date.now();

  const runAgentStream = async () => {
    try {
      const generator = AgentService.chat(message, history, orgId);
      for await (const chunk of generator) {
        chunkCount++;
        if (chunkCount === 1) {
          const timeToFirstChunk = Date.now() - streamStartTime;
          logger.debug(
            { timeToFirstChunk, conversationId },
            "Received first chunk from agent"
          );
        }
        logger.debug(
          {
            chunkLength: chunk.length,
            chunkNumber: chunkCount,
            conversationId,
          },
          "Received chunk"
        );
        agentResponse += chunk;
        stream.update(chunk);
      }
      stream.done();
      const streamDuration = Date.now() - streamStartTime;
      logger.info(
        {
          conversationId,
          totalChunks: chunkCount,
          totalCharacters: agentResponse.length,
          streamDuration,
        },
        "Stream done"
      );

      // After streaming completes, persist messages to database
      if (conversationId && orgId) {
        try {
          // Save user message only if requested
          if (persistUserMessage) {
            await AgentConversationService.addMessage(
              conversationId,
              orgId,
              "user",
              message
            );
          }

          // Save agent response
          await AgentConversationService.addMessage(
            conversationId,
            orgId,
            "model",
            agentResponse
          );

          logger.info(
            { conversationId, messageCount: 2 },
            "Messages persisted to conversation"
          );
        } catch (err) {
          logger.error(
            { err, conversationId },
            "Failed to persist messages to DB"
          );
          // Don't fail the request if persistence fails
        }
      }
    } catch (error) {
      logger.error({ err: error, conversationId }, "Chat error");
      stream.error(error);
    }
  };

  // Execute the stream processing in the background (fire-and-forget)
  runAgentStream();

  return { success: true, output: stream.value };
}

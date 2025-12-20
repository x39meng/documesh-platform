"use server";

import { AgentConversationService } from "@repo/core";
import { auth, MembershipRepository } from "@repo/core";
import { headers } from "next/headers";
import {
  PublicAgentConversationSchema,
  PublicAgentMessageSchema,
  type PublicConversation,
  type ConversationWithMessages,
} from "@/lib/types";
import { createLogger } from "@repo/core/lib/logger";

const logger = createLogger("conversations-action");

/**
 * Create a new conversation with an initial user message.
 * Returns the created conversation ID.
 */
export async function createConversation(initialMessage: string): Promise<{
  success: boolean;
  conversationId?: string;
  error?: string;
}> {
  try {
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

    if (!initialMessage || initialMessage.trim().length === 0) {
      return { success: false, error: "Initial message cannot be empty" };
    }

    const conversation = await AgentConversationService.createConversation(
      orgId,
      session.user.id,
      initialMessage.trim()
    );

    logger.info(
      { conversationId: conversation.id, userId: session.user.id },
      "Conversation created via action"
    );

    return {
      success: true,
      conversationId: conversation.id,
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to create conversation");
    return { success: false, error: "Failed to create conversation" };
  }
}

/**
 * List all conversations for the authenticated user.
 * Returns conversations sorted by most recently updated.
 */
export async function getUserConversations(
  limit = 50,
  offset = 0
): Promise<{
  success: boolean;
  conversations?: PublicConversation[];
  error?: string;
}> {
  try {
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

    const conversations = await AgentConversationService.listUserConversations(
      session.user.id,
      orgId,
      limit,
      offset
    );

    // Serialize Dates to ISO strings
    const serialized = conversations.map((conv) =>
      PublicAgentConversationSchema.parse(conv)
    );

    return {
      success: true,
      conversations: serialized,
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to list conversations");
    return { success: false, error: "Failed to load conversations" };
  }
}

/**
 * Get a single conversation with all its messages.
 */
export async function getConversation(id: string): Promise<{
  success: boolean;
  conversation?: ConversationWithMessages;
  error?: string;
}> {
  try {
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

    const data = await AgentConversationService.getConversationWithMessages(
      id,
      orgId
    );

    if (!data) {
      return { success: false, error: "Conversation not found" };
    }

    // Serialize Dates to ISO strings
    const conversation: ConversationWithMessages = {
      ...PublicAgentConversationSchema.parse(data),
      messages: data.messages.map((msg) => PublicAgentMessageSchema.parse(msg)),
    };

    return {
      success: true,
      conversation,
    };
  } catch (error) {
    logger.error(
      { err: error, conversationId: id },
      "Failed to get conversation"
    );
    return { success: false, error: "Failed to load conversation" };
  }
}

/**
 * Rename a conversation.
 */
export async function renameConversation(
  id: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  try {
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

    await AgentConversationService.renameConversation(id, orgId, title);

    logger.info(
      { conversationId: id, newTitle: title },
      "Conversation renamed"
    );

    return { success: true };
  } catch (error: unknown) {
    logger.error(
      { err: error, conversationId: id },
      "Failed to rename conversation"
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to rename conversation",
    };
  }
}

/**
 * Delete a conversation and all its messages.
 */
export async function deleteConversation(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
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

    await AgentConversationService.deleteConversation(id, orgId);

    logger.info({ conversationId: id }, "Conversation deleted");

    return { success: true };
  } catch (error: unknown) {
    logger.error(
      { err: error, conversationId: id },
      "Failed to delete conversation"
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete conversation",
    };
  }
}

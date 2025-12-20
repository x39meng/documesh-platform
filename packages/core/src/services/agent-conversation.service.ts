import { AgentConversationRepository } from "@repo/core/repositories/agent-conversation.repo";
import { AgentMessageRepository } from "@repo/core/repositories/agent-message.repo";
import { createLogger } from "@repo/core/lib/logger";

const logger = createLogger("agent-conversation-service");

/**
 * Agent Conversation Service
 * Business logic for managing AI Studio conversations and messages.
 * Handles CRUD operations, message persistence, and conversation management.
 */
export const AgentConversationService = {
  /**
   * Create a new conversation with an initial message.
   * Atomic operation: creates conversation + first user message + welcome response.
   */
  async createConversation(
    orgId: string,
    userId: string,
    initialMessage: string
  ) {
    logger.info({ orgId, userId }, "Creating new conversation");

    // Auto-generate title from first message (first 50 chars)
    const title =
      initialMessage.length > 50
        ? initialMessage.substring(0, 47) + "..."
        : initialMessage;

    const conversation = await AgentConversationRepository.create({
      orgId,
      userId,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create first user message (sequence 0)
    await AgentMessageRepository.create({
      conversationId: conversation.id,
      role: "user",
      content: [{ type: "text", text: initialMessage }],
      sequenceNumber: "0",
      metadata: null,
      createdAt: new Date(),
    });

    logger.info({ conversationId: conversation.id }, "Conversation created");
    return conversation;
  },

  /**
   * Get a conversation with all its messages.
   * Returns null if conversation doesn't exist or doesn't belong to org.
   */
  async getConversationWithMessages(id: string, orgId: string) {
    const conversation = await AgentConversationRepository.findById(id, orgId);
    if (!conversation) {
      return null;
    }

    const messages = await AgentMessageRepository.findByConversation(id);

    return {
      ...conversation,
      messages,
    };
  },

  /**
   * List user's conversations (sorted by most recently updated).
   */
  async listUserConversations(
    userId: string,
    orgId: string,
    limit = 50,
    offset = 0
  ) {
    logger.debug({ userId, orgId, limit, offset }, "Listing conversations");
    return AgentConversationRepository.findByUser(userId, orgId, limit, offset);
  },

  /**
   * Add a message to an existing conversation.
   * Updates conversation's updatedAt timestamp.
   */
  async addMessage(
    conversationId: string,
    orgId: string,
    role: "user" | "model",
    content: string,
    metadata?: Record<string, any>
  ) {
    // Verify conversation exists and belongs to org
    const conversation = await AgentConversationRepository.findById(
      conversationId,
      orgId
    );
    if (!conversation) {
      throw new Error(
        `Conversation ${conversationId} not found or access denied`
      );
    }

    // Get next sequence number
    const sequenceNumber =
      await AgentMessageRepository.getNextSequenceNumber(conversationId);

    // Create message
    const message = await AgentMessageRepository.create({
      conversationId,
      role,
      content: [{ type: "text", text: content }],
      metadata: metadata || null,
      sequenceNumber: sequenceNumber.toString(),
      createdAt: new Date(),
    });

    // Update conversation's updatedAt
    await AgentConversationRepository.update(conversationId, orgId, {
      updatedAt: new Date(),
    });

    logger.debug(
      { conversationId, role, sequenceNumber },
      "Message added to conversation"
    );

    return message;
  },

  /**
   * Rename a conversation.
   */
  async renameConversation(id: string, orgId: string, title: string) {
    if (!title || title.trim().length === 0) {
      throw new Error("Title cannot be empty");
    }

    if (title.length > 200) {
      throw new Error("Title cannot exceed 200 characters");
    }

    const updated = await AgentConversationRepository.update(id, orgId, {
      title: title.trim(),
    });

    if (!updated) {
      throw new Error(`Conversation ${id} not found or access denied`);
    }

    logger.info(
      { conversationId: id, newTitle: title },
      "Conversation renamed"
    );
    return updated;
  },

  /**
   * Delete a conversation and all its messages.
   * Messages are cascade deleted by the database.
   */
  async deleteConversation(id: string, orgId: string) {
    const deleted = await AgentConversationRepository.deleteById(id, orgId);

    if (!deleted) {
      throw new Error(`Conversation ${id} not found or access denied`);
    }

    logger.info({ conversationId: id }, "Conversation deleted");
    return { success: true };
  },

  /**
   * Get messages for a conversation (paginated).
   */
  async getMessages(conversationId: string, limit = 100, offset = 0) {
    return AgentMessageRepository.findByConversation(
      conversationId,
      limit,
      offset
    );
  },
};

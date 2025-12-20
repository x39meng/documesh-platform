"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { readStreamableValue } from "ai/rsc";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { chatWithAgent as chatWithAgentAction } from "@/actions/ai";
import {
  createConversation,
  deleteConversation as deleteConversationAction,
  renameConversation,
} from "@/actions/conversations";
import { ConversationList } from "@/components/ai/conversation-list";
import type { PublicConversation } from "@/lib/types";
import { ChatHeader } from "./chat-header";
import { WelcomeScreen } from "./welcome-screen";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

export interface Message {
  role: "user" | "model";
  content: string;
}

interface ChatInterfaceProps {
  initialConversations: PublicConversation[];
  initialMessages: Message[];
  initialConversationId: string | null;
}

export function ChatInterface({
  initialConversations,
  initialMessages,
  initialConversationId,
}: ChatInterfaceProps) {
  const router = useRouter();

  const [conversations, setConversations] =
    useState<PublicConversation[]>(initialConversations);

  // Initialize messages
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0 ? initialMessages : []
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleNewConversation() {
    router.push("/dashboard/ai-studio");
  }

  async function handleSelectConversation(id: string) {
    router.push(`/dashboard/ai-studio?conversationId=${id}`);
    setMobileMenuOpen(false);
  }

  async function handleDeleteConversation(id: string) {
    const result = await deleteConversationAction(id);
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (initialConversationId === id) {
        router.push("/dashboard/ai-studio");
      }
    }
  }

  async function handleRenameConversation(id: string, title: string) {
    const result = await renameConversation(id, title);
    if (result.success) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message optimistically
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      let currentConversationId = initialConversationId;
      let isNewConversation = false;

      // If no active conversation, create one
      if (!currentConversationId) {
        const createResult = await createConversation(userMessage);
        if (createResult.success && createResult.conversationId) {
          currentConversationId = createResult.conversationId;
          isNewConversation = true;
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "model",
              content:
                "Sorry, failed to create conversation. Please try again.",
            },
          ]);
          setLoading(false);
          return;
        }
      }

      // Prepare history
      const history = initialConversationId
        ? messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.content }],
          }))
        : [];

      // Call AI
      const result = await chatWithAgentAction(
        userMessage,
        history,
        currentConversationId,
        !isNewConversation
      );

      if (result.success && result.output) {
        setMessages((prev) => [...prev, { role: "model", content: "" }]);
        let fullContent = "";
        let chunkCount = 0;

        for await (const chunk of readStreamableValue(result.output)) {
          chunkCount++;
          if (chunkCount === 1) setLoading(false);

          if (chunk) {
            fullContent += chunk;
            setMessages((prev) => {
              const newHistory = [...prev];
              const lastMsgIndex = newHistory.length - 1;
              if (
                lastMsgIndex >= 0 &&
                newHistory[lastMsgIndex].role === "model" &&
                newHistory[lastMsgIndex].content !== fullContent
              ) {
                newHistory[lastMsgIndex] = {
                  ...newHistory[lastMsgIndex],
                  content: fullContent,
                };
              }
              return newHistory;
            });
          }
        }

        // After streaming, if it was a new conversation, update URL
        if (isNewConversation && currentConversationId) {
          router.push(
            `/dashboard/ai-studio?conversationId=${currentConversationId}`
          );
          router.refresh();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: "Sorry, I encountered an error processing your request.",
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Sorry, a network error occurred." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const conversationListComponent = (
    <ConversationList
      conversations={conversations}
      activeConversationId={initialConversationId}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onDeleteConversation={handleDeleteConversation}
      onRenameConversation={handleRenameConversation}
    />
  );

  return (
    <div className="flex h-full flex-col bg-background/50">
      <ChatHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        conversationListComponent={conversationListComponent}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <aside className="hidden md:block w-[280px] shrink-0 h-full overflow-hidden border-r bg-background/50">
            {conversationListComponent}
          </aside>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4 h-full" ref={scrollRef}>
            {messages.length === 0 ? (
              <WelcomeScreen onPromptSelect={setInput} />
            ) : (
              <MessageList messages={messages} loading={loading} />
            )}
          </ScrollArea>

          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

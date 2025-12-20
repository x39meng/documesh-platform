import { getUserConversations, getConversation } from "@/actions/conversations";
import { ChatInterface } from "@/components/ai/chat-interface";
import { redirect } from "next/navigation";

// Force dynamic since we use searchParams and auth-dependent data
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ conversationId?: string }>;
}

export default async function AIStudioPage(props: PageProps) {
  const params = await props.searchParams;
  const conversationId = params.conversationId;

  // 1. Fetch conversations list
  const conversationsResult = await getUserConversations();
  const conversations = conversationsResult.conversations || [];

  // 2. Fetch specific conversation history if ID exists
  let initialMessages: any[] = [];

  if (conversationId) {
    const convoResult = await getConversation(conversationId);

    if (convoResult.success && convoResult.conversation) {
      initialMessages = convoResult.conversation.messages.map((msg) => {
        let content = "";

        // Handle new JSONB structure (array of parts)
        if (Array.isArray(msg.content)) {
          content = msg.content.map((p: any) => p.text || "").join("");
        } else if (typeof msg.content === "string") {
          // Should not happen after migration, but safe fallback
          content = msg.content;
        }

        return {
          role: msg.role,
          content,
        };
      });
    } else {
      // If ID is invalid or not found, redirect to new conversation
      redirect("/dashboard/ai-studio");
    }
  }

  return (
    <ChatInterface
      key={conversationId || "new"}
      initialConversations={conversations}
      initialMessages={initialMessages}
      initialConversationId={conversationId || null}
    />
  );
}

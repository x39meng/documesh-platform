import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@repo/ui/utils";
import { type Message } from "./chat-interface";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

export function MessageList({ messages, loading }: MessageListProps) {
  return (
    <div className="space-y-6 pb-4 max-w-4xl mx-auto w-full">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={cn(
            "flex w-full gap-4",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {msg.role === "model" && (
            <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mt-1">
              <Bot className="h-4 w-4 text-primary" />
            </div>
          )}

          <div
            className={cn(
              "relative max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-none px-6 py-4 text-base"
                : "bg-card border border-border rounded-tl-none px-6 py-5"
            )}
          >
            {msg.role === "model" ? (
              <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-foreground/90">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  components={{
                    // Links
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        className="text-primary hover:underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                    // Tables - responsive wrapper
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-4 rounded-lg border border-border bg-background/50">
                        <table
                          className="min-w-full divide-y divide-border"
                          {...props}
                        />
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead className="bg-muted/50" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th
                        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        {...props}
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <td
                        className="px-4 py-2 text-sm whitespace-nowrap"
                        {...props}
                      />
                    ),
                    // Code blocks
                    code(props: any) {
                      const { children, className, node, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match;
                      if (!isInline) {
                        return (
                          <div className="relative group my-4 rounded-lg overflow-hidden border bg-zinc-950/50">
                            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b">
                              <span className="text-xs font-mono text-zinc-400">
                                {match?.[1] || "text"}
                              </span>
                            </div>
                            <div className="p-4 overflow-x-auto">
                              <code className={className} {...rest}>
                                {children}
                              </code>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <code
                          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary font-semibold"
                          {...rest}
                        >
                          {children}
                        </code>
                      );
                    },
                    // Lists
                    ul: ({ node, ordered, ...props }: any) => (
                      <ul
                        className="list-disc pl-5 space-y-1 my-2"
                        {...props}
                      />
                    ),
                    ol: ({ node, ordered, ...props }: any) => (
                      <ol
                        className="list-decimal pl-5 space-y-1 my-2"
                        {...props}
                      />
                    ),
                    li: ({ node, ordered, ...props }: any) => (
                      <li className="pl-1" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong
                        className="font-bold text-foreground"
                        {...props}
                      />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            ) : (
              <span className="whitespace-pre-wrap">{msg.content}</span>
            )}
          </div>

          {msg.role === "user" && (
            <div className="h-8 w-8 shrink-0 rounded-full bg-secondary flex items-center justify-center mt-1">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="flex w-full gap-4 justify-start">
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="bg-card border border-border rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
          </div>
        </div>
      )}
    </div>
  );
}

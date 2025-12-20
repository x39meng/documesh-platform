import { Send } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/utils";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  loading,
}: ChatInputProps) {
  return (
    <div className="p-4 border-t bg-background/80 backdrop-blur-md shrink-0">
      <form
        onSubmit={onSubmit}
        className="relative flex items-center gap-2 max-w-4xl mx-auto w-full"
      >
        <input
          className="flex-1 bg-secondary/50 border border-transparent rounded-full px-6 py-3 text-sm focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50 shadow-inner"
          placeholder="Ask about your documents..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          className={cn(
            "rounded-full h-11 w-11 shrink-0 transition-all",
            input.trim()
              ? "translate-x-0 opacity-100"
              : "translate-x-2 opacity-50 disabled:opacity-50"
          )}
          disabled={!input.trim() || loading}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
      <div className="text-center mt-2">
        <p className="text-[10px] text-muted-foreground/50">
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}

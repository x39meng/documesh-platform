import {
  Search,
  TrendingUp,
  PieChart,
  BrainCircuit,
  Sparkles,
} from "lucide-react";
import { cn } from "@repo/ui/utils";

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
}

export function WelcomeScreen({ onPromptSelect }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2 max-w-lg">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome to AI Studio
        </h2>
        <p className="text-muted-foreground text-lg">
          I'm your intelligent assistant. I can analyze resumes, track trends,
          and answer questions about your data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
        {[
          {
            icon: Search,
            label: "Find Candidates",
            prompt: "Find resumes with React and TypeScript experience",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            icon: TrendingUp,
            label: "Analyze Trends",
            prompt: "Show me submission trends for the last 30 days",
            color: "text-green-500",
            bg: "bg-green-500/10",
          },
          {
            icon: PieChart,
            label: "Skill Breakdown",
            prompt: "What are the most common technical skills?",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
          {
            icon: BrainCircuit,
            label: "Deep Insights",
            prompt: "Analyze average years of experience by skill",
            color: "text-orange-500",
            bg: "bg-orange-500/10",
          },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => onPromptSelect(item.prompt)}
            className="group p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all hover:shadow-md hover:border-primary/20 flex items-start gap-4"
          >
            <div className={cn("p-2 rounded-lg shrink-0", item.bg, item.color)}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="font-semibold block group-hover:text-primary transition-colors">
                {item.label}
              </span>
              <span className="text-xs text-muted-foreground block text-left">
                {item.prompt}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

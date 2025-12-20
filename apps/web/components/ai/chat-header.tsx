import Link from "next/link";
import { ArrowLeft, Menu, Sparkles, PanelLeft } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Sheet, SheetContent, SheetTrigger } from "@repo/ui/components/sheet";
import { ReactNode } from "react";

interface ChatHeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  conversationListComponent: ReactNode;
}

export function ChatHeader({
  mobileMenuOpen,
  setMobileMenuOpen,
  showSidebar,
  setShowSidebar,
  conversationListComponent,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        {/* Mobile menu button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            {conversationListComponent}
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setShowSidebar(!showSidebar)}
          title="Toggle History"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 ml-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AI Studio</h1>
            <p className="text-xs text-muted-foreground">
              Powered by Gemini 3.0
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

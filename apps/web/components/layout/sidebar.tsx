"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui/utils";
import { Button } from "@repo/ui/components/button";
import { FileText, Sparkles, Settings, LogOut } from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const NAV_ITEMS = [
  {
    title: "Submissions",
    href: "/dashboard/submissions",
    icon: FileText,
    match: (pathname: string) =>
      pathname === "/dashboard/submissions" ||
      pathname.startsWith("/dashboard/submissions/"),
  },
  {
    title: "AI Studio",
    href: "/dashboard/ai-studio",
    icon: Sparkles,
    match: (pathname: string) => pathname.startsWith("/dashboard/ai-studio"),
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn("pb-12 bg-card border-r h-full flex flex-col", className)}
    >
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <div className="mb-6 px-4 flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
              <span className="font-bold text-xs text-primary">D</span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">Documesh</h2>
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.href}
                variant={item.match(pathname || "") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  item.match(pathname || "") && "bg-secondary/50 font-medium"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 py-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

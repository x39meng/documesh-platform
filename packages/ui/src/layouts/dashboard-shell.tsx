import { cn } from "../utils";
import React from "react";

export function DashboardShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <div className={cn("container flex flex-1 flex-col gap-12", className)}>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

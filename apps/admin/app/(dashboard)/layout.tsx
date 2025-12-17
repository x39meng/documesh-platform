import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@repo/ui/auth";
import { auth } from "@repo/core";
import { LayoutDashboard, Settings, LogOut, FileText, Building2 } from "lucide-react";
import { cn } from "@repo/ui/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  // Placeholder for future settings
  // { name: "Settings", href: "/settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",");
  if (!adminEmails.includes(session.user.email)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p>You are not authorized to view this page.</p>
        <Link href="/login" className="text-blue-500 hover:underline">
          Go back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-80 flex-col border-r border-border bg-card shadow-xl sm:flex transition-all">
        <div className="flex h-16 items-center border-b border-border px-6 bg-card/50 backdrop-blur-sm">
          <Link className="flex items-center gap-2 font-bold text-lg tracking-tight" href="/">
            <FileText className="h-6 w-6" />
            <span className="">DocuMesh Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-4 text-sm font-medium space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:bg-secondary/50 hover:border-border/50 border border-transparent",
                  item.href === "/" && "bg-primary/5 text-primary border-primary/20 shadow-sm"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-border p-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{session.user.name}</span>
                    <span className="text-xs text-muted-foreground">{session.user.email}</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 sm:pl-80 transition-all active:pl-80">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 shadow-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-10 sm:py-6">
            <div className="flex items-center gap-2 sm:hidden">
                <FileText className="h-6 w-6" />
                <span className="font-semibold">DocuMesh Admin</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
                 {/* Mobile User Menu could go here */}
            </div>
        </header>
        <main className="flex-1 p-4 sm:px-10 sm:py-0">
          {children}
        </main>
      </div>
    </div>
  );
}

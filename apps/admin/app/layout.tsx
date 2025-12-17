import "./globals.css";
import type { Metadata } from "next";
import { fontSans } from "@repo/ui/fonts";
import { PublicEnvProvider } from "@/components/public-env-provider";
import { Toaster } from "@repo/ui/components/sonner";

export const metadata: Metadata = {
  title: "DocuMesh Admin",
  description: "Admin Console for DocuMesh Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={fontSans.className} suppressHydrationWarning>
        <PublicEnvProvider />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

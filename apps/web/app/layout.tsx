import "./globals.css";
import type { Metadata } from "next";
import { fontSans } from "@repo/ui/fonts";
import { PublicEnvProvider } from "@/components/public-env-provider";

export const metadata: Metadata = {
  title: "DocuMesh Platform",
  description: "High-Velocity Ingestion",
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
      </body>
    </html>
  );
}

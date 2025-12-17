import { OrganizationRepository } from "@repo/core";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { SubmitButton } from "@/components/submit-button";
import { rotateApiKey, updateAllowedIps } from "@/actions/organization";
import { ChevronLeft, Key, Shield } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { RotateKeyForm, UpdateIpsForm } from "@/components/org-forms";

export default async function OrgPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const org = await OrganizationRepository.findById(id);

  if (!org) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Link 
            href="/" 
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Organizations
        </Link>
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{org.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="font-mono">{org.id}</span>
                    {/* Badge could go here */}
                </div>
            </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* API Configuration Card */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    <CardTitle>API Configuration</CardTitle>
                </div>
                <CardDescription>Manage API access credentials for this organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">API Key</label>
                    <div className="flex items-center gap-2">
                        <code className="relative flex-1 rounded bg-muted px-[0.5rem] py-[0.5rem] font-mono text-sm font-semibold overflow-hidden text-ellipsis border">
                            {org.apiKey}
                        </code>
                        <CopyButton value={org.apiKey} />
                    </div>
                    <p className="text-xs text-muted-foreground">This key grants full access to the DocuMesh API.</p>
                </div>
                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Danger Zone</h4>
                     <RotateKeyForm orgId={org.id} />
                    <p className="text-xs text-muted-foreground mt-2">Rotating the key will immediately invalidate the old one.</p>
                </div>
            </CardContent>
        </Card>

        {/* Security / IP Allowlist Card */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                     <CardTitle>Security</CardTitle>
                </div>
                <CardDescription>Configure IP allowlist (CIDR notation) for restricted access.</CardDescription>
            </CardHeader>
            <CardContent>
                <UpdateIpsForm orgId={org.id} initialIps={org.allowedIps as string[]} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

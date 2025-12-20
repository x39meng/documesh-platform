"use client";

import { type PublicSubmission } from "@/lib/types";
import { SplitView } from "@/components/document/split-view";
import { ResumeViewer } from "@/components/document/resume-viewer";
import { Button } from "@repo/ui/components/button";
import { ArrowLeft, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { extractBBoxes } from "@/lib/data-helpers";
import Link from "next/link";
import { cn } from "@repo/ui/utils";
import { SelectionProvider } from "@/context/selection-context";

interface SubmissionDetailProps {
  detail: PublicSubmission;
  pdfUrl: string | null;
}

export function SubmissionDetail({ detail, pdfUrl }: SubmissionDetailProps) {
  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading document...</p>
      </div>
    );
  }

  return (
    <SelectionProvider>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header/Toolbar */}
        <div className="border-b bg-card px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/submissions">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg">{detail.documentType}</h1>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                    detail.status === "completed"
                      ? "bg-success/10 text-success"
                      : detail.status === "failed"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                  )}
                >
                  {detail.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                ID: {detail.id.slice(0, 8)} • Uploaded{" "}
                {new Date(detail.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={pdfUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-3 w-3" />
              Raw PDF
            </a>
          </Button>
        </div>

        {/* Split View Content */}
        <div className="flex-1 overflow-hidden">
          <SplitView
            pdfUrl={pdfUrl}
            allBBoxes={
              detail.finalData ? extractBBoxes(detail.finalData) : undefined
            }
          >
            <div className="min-h-full flex flex-col bg-background h-full overflow-hidden">
              <div className="flex-1 overflow-auto">
                {detail.status === "processing" && (
                  <div className="p-20 text-center space-y-6">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        Analyzing Document
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Extracting structured data from PDF...
                      </p>
                    </div>
                  </div>
                )}

                {detail.status === "completed" &&
                  detail.hasData &&
                  (detail.documentType === "RESUME" ? (
                    <ResumeViewer data={detail.finalData as any} />
                  ) : (
                    <div className="p-6">
                      <div className="bg-zinc-950 rounded-lg overflow-hidden border border-border shadow-sm">
                        <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
                          JSON Output
                        </div>
                        <pre className="p-4 text-xs text-zinc-300 font-mono overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-700">
                          {JSON.stringify(detail.finalData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}

                {detail.status === "failed" && (
                  <div className="p-12">
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 flex flex-col items-center text-center gap-4">
                      <div className="p-3 bg-destructive/10 rounded-full">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-destructive">
                          Extraction Failed
                        </h3>
                        <p className="text-sm text-destructive/80 mt-1">
                          We encountered an error processing this document.
                          Please verify the PDF file is not corrupted and try
                          again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SplitView>
        </div>
      </div>
    </SelectionProvider>
  );
}

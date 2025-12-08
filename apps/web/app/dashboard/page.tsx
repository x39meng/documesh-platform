"use client";

import { useState, useEffect } from "react";
import { getSubmissions, getSubmission } from "@/actions/ingest";
import { type PublicSubmission } from "@/lib/types";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Upload,
} from "lucide-react";
import Dropzone from "@/components/upload/dropzone";

import { DashboardShell } from "@repo/ui/layouts/dashboard-shell";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/utils";

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<PublicSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PublicSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadSubmissions(true);
      if (selectedId) {
        // We always poll the detail if selected, to catch status changes
        // We could optimize to only poll if pending/processing, but checking the fresh data is safer
        // and allows catching "failed" -> "completed" if we ever support retries, etc.
        // But primarily we care about pending/processing -> completed/failed.
        loadDetail(selectedId);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedId]);

  async function loadSubmissions(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error("Failed to load submissions:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    try {
      const data = await getSubmission(id);
      // Only update if data changed to avoid unnecessary re-renders if we were using memoized components
      // But here simple setDetail is fine
      setDetail(data);
    } catch (error) {
      console.error("Failed to load submission detail:", error);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return (
          <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
        );
      case "failed":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "pending":
      case "processing":
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Document Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowUpload(!showUpload)}
            variant={showUpload ? "secondary" : "default"}
          >
            {showUpload ? (
              "Cancel"
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await import("@/lib/auth-client").then((m) =>
                m.authClient.signOut()
              );
              window.location.href = "/login";
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {showUpload && (
        <div className="mb-8">
          <Dropzone
            onUploadSuccess={(id) => {
              setShowUpload(false);
              loadSubmissions();
              setSelectedId(id);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions List */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Recent Submissions
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No submissions yet</p>
              <p className="text-sm mt-1">Upload a document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedId(sub.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg transition-all border",
                    selectedId === sub.id
                      ? "bg-accent border-primary/50"
                      : "bg-background border-border hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(sub.status)}
                      <div>
                        <p className="text-foreground font-medium">
                          {sub.documentType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        sub.status === "completed"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : sub.status === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {sub.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail View */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Extraction Results
          </h2>

          {!selectedId ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Select a submission to view details</p>
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(detail.status)}
                  <span className="text-foreground font-medium capitalize">
                    {detail.status}
                  </span>
                </div>
              </div>

              {detail.finalData && (
                <div className="mt-4">
                  <h3 className="text-foreground font-medium mb-3">
                    Extracted Data
                  </h3>
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(detail.finalData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {!detail.finalData && detail.status === "pending" && (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
                  <p>Processing document...</p>
                </div>
              )}

              {!detail.finalData && detail.status === "failed" && (
                <div className="text-center py-8 text-destructive">
                  <XCircle className="w-8 h-8 mx-auto mb-3" />
                  <p>Extraction failed</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

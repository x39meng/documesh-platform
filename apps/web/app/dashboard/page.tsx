
"use client";

import { useEffect, useState, useRef } from "react";
import { getSubmissions, getSubmission, getFileUrl } from "@/actions/ingest";
import { type PublicSubmission } from "@/lib/types";
import { cn } from "@repo/ui/utils";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Upload,
  Search,
  ExternalLink
} from "lucide-react";
import { UploadDialog } from "@/components/upload-dialog";
import { SplitView } from "@/components/document/split-view";
import { ResumeViewer } from "@/components/document/resume-viewer";
import { SelectionProvider } from "@/context/selection-context";
import { extractBBoxes } from "@/lib/data-helpers";

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<PublicSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PublicSubmission | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track the file key of the currently loaded PDF to prevent unnecessary refetches
  // and ensure we fetch when the document changes (even if pdfUrl state is stale in closure)
  const currentPdfKeyRef = useRef<string | null>(null);

  // Initial load
  useEffect(() => {
    loadSubmissions();
  }, []);

  // Detail loading when selection changes
  useEffect(() => {
    if (selectedId) {
      // Clear previous PDF state immediately to show loading spinner
      setPdfUrl(null);
      currentPdfKeyRef.current = null; 
      loadDetail(selectedId);
    } else {
      setDetail(null);
      setPdfUrl(null);
      currentPdfKeyRef.current = null;
    }
  }, [selectedId]);

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadSubmissions(true);
      if (selectedId && detail?.status !== "completed") {
        loadDetail(selectedId);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedId, detail?.status]);

  async function loadSubmissions(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    try {
        const data = await getSubmission(id);
        if (data) {
            setDetail(data);
            
            // Only fetch PDF URL if we have a key AND it differs from what's currently loaded
            if (data.fileKey && data.fileKey !== currentPdfKeyRef.current) {
                const url = await getFileUrl(data.fileKey);
                setPdfUrl(url);
                currentPdfKeyRef.current = data.fileKey;
            }
        }
    } catch (error) {
        console.error("Failed to load detail", error);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
      case "processing": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <SelectionProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-card flex flex-col shrink-0 z-20 shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm">
                <span className="font-bold text-lg tracking-tight">Documesh</span>
                <UploadDialog
                    trigger={
                        <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary">
                            <Upload className="w-4 h-4" />
                        </Button>
                    }
                    onSuccess={(id) => {
                        loadSubmissions();
                        setSelectedId(id);
                    }}
                />
            </div>
            
            {/* Search */}
            <div className="p-4 pt-2">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                        className="w-full bg-secondary/30 border border-transparent rounded-lg pl-9 pr-4 py-2 text-sm focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50"
                        placeholder="Search documents..." 
                    />
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="px-2 pb-4 space-y-1">
                    {submissions.map((sub) => (
                        <button
                            key={sub.id}
                            onClick={() => setSelectedId(sub.id)}
                            className={cn(
                                "w-full text-left px-3 py-3 rounded-lg transition-all text-sm group border border-transparent",
                                selectedId === sub.id 
                                    ? "bg-primary/5 border-primary/20 shadow-sm" 
                                    : "hover:bg-secondary/50 hover:border-border/50"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={cn("font-medium truncate transition-colors", selectedId === sub.id ? "text-primary" : "text-foreground")}>
                                    {sub.documentType}
                                </span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5 opacity-70">
                                    {new Date(sub.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                                {getStatusIcon(sub.status)}
                                <span className="capitalize">{sub.status}</span>
                            </div>
                        </button>
                    ))}
                    {submissions.length === 0 && !loading && (
                        <div className="text-center py-8 text-xs text-muted-foreground flex flex-col items-center gap-2">
                            <FileText className="w-8 h-8 opacity-20" />
                            <span>No documents found</span>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col bg-background h-full overflow-hidden relative">
            {!selectedId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 animate-in fade-in zoom-in-95 duration-500">
                     <div className="w-20 h-20 rounded-3xl bg-secondary/50 mb-6 flex items-center justify-center shadow-inner">
                        <FileText className="w-10 h-10 opacity-30" />
                     </div>
                     <p className="text-lg font-medium text-foreground/80">Select a document to view details</p>
                     <p className="text-sm opacity-50">Choose from the list on the left or upload a new PDF.</p>
                </div>
            ) : !detail || !pdfUrl ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : (
                <SplitView pdfUrl={pdfUrl} allBBoxes={detail.finalData ? extractBBoxes(detail.finalData) : undefined}>
                     <div className="min-h-full flex flex-col">
                        {/* Toolbar */}
                        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border p-4 flex justify-between items-center shrink-0">
                             <div className="flex items-center gap-3">
                                <h2 className="font-bold text-lg">{detail.documentType}</h2>
                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                                    detail.status === "completed" ? "bg-green-500/10 text-green-600" :
                                    detail.status === "failed" ? "bg-red-500/10 text-red-600" :
                                    "bg-blue-500/10 text-blue-600"
                                )}>
                                    {detail.status}
                                </span>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                                    <a href={pdfUrl} target="_blank" rel="noreferrer">
                                        <ExternalLink className="w-3 h-3" />
                                        <span>Raw PDF</span>
                                    </a>
                                </Button>
                             </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            {detail.status === 'processing' && (
                                <div className="p-20 text-center space-y-6">
                                    <div className="relative mx-auto w-16 h-16">
                                        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-foreground">Analyzing Document</p>
                                        <p className="text-sm text-muted-foreground">Extracting structured data from PDF...</p>
                                    </div>
                                </div>
                            )}

                            {detail.status === 'completed' && detail.hasData && (
                                detail.documentType === 'RESUME' ? (
                                    <ResumeViewer data={detail.finalData} />
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
                                )
                            )}
                            
                            {detail.status === 'failed' && (
                                <div className="p-12">
                                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 flex flex-col items-center text-center gap-4">
                                        <div className="p-3 bg-destructive/10 rounded-full">
                                            <AlertCircle className="w-8 h-8 text-destructive" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-destructive">Extraction Failed</h3>
                                            <p className="text-sm text-destructive/80 mt-1">
                                                We encountered an error processing this document. Please verify the PDF file is not corrupted and try again.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                </SplitView>
            )}
        </div>
      </div>
    </SelectionProvider>
  );
}

"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const PDFViewer = dynamic(() => import("./pdf-viewer").then(mod => mod.PDFViewer), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900/50 animate-pulse" />
});

interface SplitViewProps {
  pdfUrl: string;
  allBBoxes?: number[][];
  children: ReactNode; // Data Panel content
}

export function SplitView({ pdfUrl, allBBoxes, children }: SplitViewProps) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Pane: PDF */}
      <div className="w-1/2 min-w-[400px] h-full bg-zinc-950/30">
        <PDFViewer url={pdfUrl} allBBoxes={allBBoxes} />
      </div>

      {/* Right Pane: Data */}
      <div className="w-1/2 h-full overflow-y-auto bg-card border-l border-border">
        {children}
      </div>
    </div>
  );
}

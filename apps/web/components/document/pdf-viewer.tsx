
"use client";

import { useSelection } from "@/context/selection-context";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@repo/ui/components/button";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure worker locally
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  allBBoxes?: number[][];
}

export function PDFViewer({ url, allBBoxes }: PDFViewerProps) {
  const [scale, setScale] = useState(1.0);
  const { highlightedBbox } = useSelection();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);

  const zoomIn = () => setScale(p => Math.min(p + 0.125, 3.0));
  const zoomOut = () => setScale(p => Math.max(p - 0.125, 0.5));

  // Handle Ctrl+Scroll to zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.005; // Sensitivity
        setScale(prev => Math.min(Math.max(prev + delta, 0.1), 5.0));
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // Auto-fit on load
  const onPageLoadSuccess = ({ originalWidth, originalHeight }: { originalWidth: number; originalHeight: number }) => {
      // Only set initial scale if we haven't manually adjusted it yet (heuristic: dimensions changed)
      if (!pdfDimensions || pdfDimensions.width !== originalWidth) {
          setPdfDimensions({ width: originalWidth, height: originalHeight });
          
          if (containerRef.current) {
              const { clientWidth, clientHeight } = containerRef.current;
              const padding = 64; // p-8 = 2rem = 32px per side
              
              const scaleX = (clientWidth - padding) / originalWidth;
              const scaleY = (clientHeight - padding) / originalHeight;
              
              // Fit inside (Contain)
              const bestScale = Math.min(scaleX, scaleY);
              // Ensure reasonable limits
              setScale(Math.max(bestScale, 0.2)); 
          }
      }
  };

  const renderBBox = (bbox: number[], i: number | string, isHighlighted: boolean) => {
     // Coordinate System: [x1, y1, x2, y2] normalized to 1000
     // bbox[0] = x1 (Left)
     // bbox[1] = y1 (Top)
     // bbox[2] = x2 (Right)
     // bbox[3] = y2 (Bottom)
     const left = (bbox[0] / 1000) * 100;
     const top = (bbox[1] / 1000) * 100;
     const width = ((bbox[2] - bbox[0]) / 1000) * 100;
     const height = ((bbox[3] - bbox[1]) / 1000) * 100;
     
     return (
        <div
           key={i}
           className={`absolute border-2 transition-all duration-200 ${
             isHighlighted 
               ? "border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-50" 
               : "border-primary/10 bg-primary/5 z-10 hover:border-primary/60"
           }`}
           style={{
             top: `${top}%`,
             left: `${left}%`,
             width: `${width}%`,
             height: `${height}%`,
           }}
        />
     );
  };

  return (
    <div className="flex flex-col items-center bg-zinc-900/50 h-full overflow-hidden border-r border-border relative">
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2 bg-background/90 backdrop-blur p-2 rounded-lg border border-border shadow-lg">
          <Button variant="ghost" size="icon" onClick={zoomOut} className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
          <span className="flex items-center justify-center w-12 text-xs font-mono font-medium">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={zoomIn} className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 w-full overflow-auto p-8 pb-20 flex justify-center"
      >
          <Document
            file={url}
            loading={
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            }
            className="shadow-2xl"
          >
            <div className="relative">
              <Page
                pageNumber={1}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="rounded-lg overflow-hidden border border-border/50 bg-white"
                onLoadSuccess={onPageLoadSuccess}
              />

              {/* All BBoxes */}
              {allBBoxes?.map((bbox, i) => renderBBox(bbox, i, false))}
              
              {/* Highlighted BBox Overlay */}
              {highlightedBbox && renderBBox(highlightedBbox, 'highlighted', true)}
            </div>
          </Document>
      </div>
    </div>
  );
}

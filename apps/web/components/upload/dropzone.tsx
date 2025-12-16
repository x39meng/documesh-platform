"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@repo/ui/utils";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export default function Dropzone({ onFileSelect, isLoading }: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles?.[0]) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isLoading,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out h-64 flex flex-col items-center justify-center gap-4 text-center",
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-accent/50",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="p-5 rounded-full bg-primary/10 text-primary">
        <UploadCloud className={cn("w-10 h-10 transition-transform duration-300", isDragActive && "scale-110")} />
      </div>
      
      <div className="space-y-1 px-4">
        <p className="text-lg font-medium text-foreground">
          {isDragActive ? "Drop PDF here" : "Click or drag to upload"}
        </p>
        <p className="text-sm text-muted-foreground">
          Supports PDF files only (max 10MB)
        </p>
      </div>
    </div>
  );
}


"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { initiateUpload, finalizeUpload } from "@/actions/ingest";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@repo/ui/utils";

export default function Dropzone({
  onUploadSuccess,
}: {
  onUploadSuccess: (id: string) => void;
}) {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      setStatus("uploading");

      try {
        // 1. Get Presigned URL
        const { url, key } = await initiateUpload(file.name);
        // 2. Upload to S3
        await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        // 3. Finalize
        const result = await finalizeUpload(key);
        if (result.success) {
          setStatus("success");
          onUploadSuccess(result.id);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    },
    [onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: status === "uploading" || status === "success",
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-12 transition-all duration-300 ease-in-out",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent",
          status === "success" &&
            "border-green-500 bg-green-500/10 dark:text-green-400",
          status === "error" && "border-destructive bg-destructive/10"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <div className="p-4 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {isDragActive ? "Drop your PDF here" : "Upload PDF"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                  Drag and drop your PDF file here, or click to browse.
                </p>
              </motion.div>
            )}

            {status === "uploading" && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium text-foreground">
                  Uploading {fileName}...
                </p>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <div className="p-4 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Upload Complete!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Upload Failed
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please try again.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

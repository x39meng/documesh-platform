"use client";

import { useState, ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import Dropzone from "@/components/upload/dropzone";
import { initiateUpload, finalizeUpload } from "@/actions/ingest";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { motion, AnimatePresence } from "framer-motion";

interface UploadDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess: (id: string, action?: "DONE" | "REFRESH_ONLY") => void; // Update signature to match usage
  trigger?: ReactNode;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function UploadDialog({ isOpen: controlledIsOpen, onClose: controlledOnClose, onSuccess, trigger }: UploadDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedId, setUploadedId] = useState<string | null>(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const close = () => {
    if (isControlled && controlledOnClose) {
        controlledOnClose();
    } else {
        setInternalIsOpen(false);
    }
  };

  const reset = () => {
    setStatus("idle");
    setCurrentFile(null);
    setErrorMsg(null);
    setUploadedId(null);
  };

  const handleClose = () => {
    if (status === "uploading") return;
    reset();
    close();
  };

  const handleFileSelect = async (file: File) => {
    setCurrentFile(file);
    setStatus("uploading");
    
    try {
      // 1. Get Presigned URL
      const { url, key } = await initiateUpload(file.name);
      
      // 2. Upload to S3
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) throw new Error("Failed to upload to storage");

      // 3. Finalize
      const result = await finalizeUpload(key);
      if (result.success && result.id) {
        setStatus("success");
        setUploadedId(result.id);
      } else {
        throw new Error("Failed to finalize submission");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      {trigger && (
        <div onClick={() => setInternalIsOpen(true)}>
            {trigger}
        </div>
      )}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Upload Document"
        className="max-w-xl"
      >
        <div className="min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Dropzone onFileSelect={handleFileSelect} />
              </motion.div>
            )}

            {status === "uploading" && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <div className="relative p-4 bg-primary/10 rounded-full text-primary">
                    <Loader2 className="w-10 h-10 animate-spin" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Uploading...</h3>
                  <p className="text-muted-foreground mt-1 max-w-[200px] truncate">
                    {currentFile?.name}
                  </p>
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="p-4 bg-green-500/10 rounded-full text-green-600 dark:text-green-400">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">Success!</h3>
                  <p className="text-muted-foreground mt-2">
                    Your document has been queued for extraction.
                  </p>
                </div>
                <div className="flex gap-3">
                   <Button
                    variant="outline"
                    onClick={() => {
                      if (uploadedId) onSuccess(uploadedId, "REFRESH_ONLY"); 
                      reset();
                      handleClose();
                    }}
                  >
                    Upload Another
                  </Button>
                  <Button
                    onClick={() => {
                      if (uploadedId) onSuccess(uploadedId, "DONE");
                      reset();
                      handleClose();
                    }}
                  >
                    View Document
                  </Button>
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="p-4 bg-destructive/10 rounded-full text-destructive">
                  <AlertCircle className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Upload Failed</h3>
                  <p className="text-muted-foreground mt-2">
                    {errorMsg || "An error occurred during upload."}
                  </p>
                </div>
                <Button onClick={reset} variant="secondary">
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>
    </>
  );
}

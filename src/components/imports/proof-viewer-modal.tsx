"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProofViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileUrl?: string;
  mimeType?: string;
}

export function ProofViewerModal({
  open,
  onOpenChange,
  fileName,
  fileUrl,
  mimeType,
}: ProofViewerModalProps) {
  const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const isImage =
    mimeType?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp)$/i.test(fileName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Proof of Payment</DialogTitle>
          <DialogDescription>{fileName}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto rounded-lg border border-border/60 bg-deep-black/60">
          {!fileUrl ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Proof file is no longer available for this record.
            </p>
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt={`Proof of payment: ${fileName}`}
              className="mx-auto max-h-[65vh] w-auto object-contain p-4"
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={`Proof of payment: ${fileName}`}
              className="h-[65vh] w-full"
            />
          ) : (
            <iframe
              src={fileUrl}
              title={`Proof of payment: ${fileName}`}
              className="h-[65vh] w-full"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

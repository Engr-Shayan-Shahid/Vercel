"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorCardProps {
  title?: string;
  message?: string;
  className?: string;
  onRetry?: () => void;
}

export function ErrorCard({
  title = "Something went wrong",
  message = "We couldn't load this section. Please try again.",
  className,
  onRetry,
}: ErrorCardProps) {
  const router = useRouter();

  function handleRetry() {
    onRetry?.();
    router.refresh();
  }

  return (
    <Card className={cn("border-destructive/30 bg-destructive/5", className)}>
      <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRetry} className="shrink-0">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

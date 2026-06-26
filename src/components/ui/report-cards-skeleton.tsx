import { Skeleton } from "@/components/ui/skeleton";

interface ReportCardsSkeletonProps {
  count?: number;
}

export function ReportCardsSkeleton({ count = 6 }: ReportCardsSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-xl border border-border/60 bg-card p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-6 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="mt-auto flex gap-2 pt-5">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      ))}
    </>
  );
}

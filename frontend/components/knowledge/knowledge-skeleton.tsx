import { Card, Skeleton } from "@/components/ui/card";

export function KnowledgeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading documents">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[74px]" />
        ))}
      </div>
      <div className="mb-4 flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Card className="space-y-3 p-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </Card>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 px-1 pt-2 pb-1">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="mt-3 h-4 w-32 rounded-md" />
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="mt-1 h-6 w-40 rounded-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

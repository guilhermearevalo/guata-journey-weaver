import { forwardRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const CmsPageSkeleton = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div ref={ref} className="min-h-screen bg-background">
      {/* Hero Skeleton */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <Skeleton className="mx-auto h-12 w-64 mb-4" />
          <Skeleton className="mx-auto h-6 w-96" />
        </div>
      </section>

      {/* Content Skeleton */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-48 mt-8" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </section>
    </div>
  );
});

CmsPageSkeleton.displayName = 'CmsPageSkeleton';

export default CmsPageSkeleton;

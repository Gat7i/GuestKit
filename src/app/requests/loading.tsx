import { PageHeaderSkeleton, ListSkeleton, GridSkeleton } from '@/components/ui/Skeleton'

export default function RequestsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeaderSkeleton />
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <div>
          <div className="animate-pulse bg-gray-200 rounded h-6 w-48 mb-4" />
          <ListSkeleton count={3} />
        </div>
        <div>
          <div className="animate-pulse bg-gray-200 rounded h-6 w-40 mb-6" />
          <GridSkeleton count={6} />
        </div>
      </div>
    </div>
  )
}

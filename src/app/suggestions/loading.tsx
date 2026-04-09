import { PageHeaderSkeleton, GridSkeleton } from '@/components/ui/Skeleton'

export default function SuggestionsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeaderSkeleton />
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <GridSkeleton count={6} />
      </div>
    </div>
  )
}

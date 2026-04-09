import { PageHeaderSkeleton, ListSkeleton } from '@/components/ui/Skeleton'

export default function ShowsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeaderSkeleton />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <ListSkeleton count={5} />
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function RestaurantNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-8xl mb-6">🍽️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Restaurant introuvable
        </h1>
        <p className="text-gray-600 mb-8">
          Le restaurant que vous recherchez n'existe pas ou a été retiré de notre carte.
        </p>
        <Link
          href="/restaurants"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md"
        >
          <span>←</span>
          Voir tous nos restaurants
        </Link>
      </div>
    </div>
  )
}
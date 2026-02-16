import Link from 'next/link'

export default function ActivityNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-8xl mb-6">🎭</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Activité introuvable
        </h1>
        <p className="text-gray-600 mb-8">
          L'activité que vous recherchez n'existe pas ou n'est plus disponible.
        </p>
        <Link
          href="/activities"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md"
        >
          <span>←</span>
          Voir toutes nos activités
        </Link>
      </div>
    </div>
  )
}
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

export default function ShowNotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <Icon.Show className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Spectacle introuvable</h1>
        <p className="text-gray-400 mb-6">Ce spectacle n'existe pas ou n'est plus disponible.</p>
        <Link
          href="/shows"
          className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-medium transition"
        >
          ← Retour aux spectacles
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@guestskit.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Authentification
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // 2. Vérifier le profil et le rôle
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, roles(name)')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          throw new Error('Profil non trouvé')
        }

        // 3. Vérifier si c'est un admin
        const adminRoles = ['super_admin', 'hotel_admin', 'staff']
        if (!adminRoles.includes(profile.roles?.name)) {
          throw new Error('Accès non autorisé')
        }

        // 4. Récupérer l'hôtel associé au profil (si existe)
        if (profile.hotel_id) {
          const { data: hotel } = await supabase
            .from('hotels')
            .select('slug, name')
            .eq('id', profile.hotel_id)
            .single()
          
          // Stocker les infos de l'hôtel dans un cookie ou localStorage si nécessaire
          if (hotel) {
            // Optionnel : stocker pour usage ultérieur
            localStorage.setItem('currentHotel', JSON.stringify(hotel))
          }
        }

        // 5. Rediriger
        router.push('/admin')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4">
            🏨
          </div>
          <h1 className="text-2xl font-bold text-gray-800">GuestSkit Admin</h1>
          <p className="text-gray-600 text-sm mt-1">Connectez-vous pour gérer votre hôtel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Note d'information pour la démo */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Démo : admin@guestskit.com / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
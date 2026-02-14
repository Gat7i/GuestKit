'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const logout = async () => {
      // Nettoyer le localStorage (au cas où)
      localStorage.removeItem('currentHotel')
      
      // Déconnexion de Supabase
      await supabase.auth.signOut()
      
      // Redirection vers la page de login
      router.push('/admin/login')
      router.refresh()
    }
    logout()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20">
        <div className="text-5xl mb-4 animate-spin text-white">⏳</div>
        <p className="text-white text-lg">Déconnexion en cours...</p>
        <p className="text-white/70 text-sm mt-2">Vous allez être redirigé</p>
      </div>
    </div>
  )
}
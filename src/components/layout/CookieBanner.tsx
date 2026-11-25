'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) setVisible(true)
  }, [])

  const accept = () => { localStorage.setItem('cookie_consent', 'accepted'); setVisible(false) }
  const decline = () => { localStorage.setItem('cookie_consent', 'declined'); setVisible(false) }

  if (!visible) return null

  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 border-t border-gray-700 shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-300 flex-1">
          Ce site utilise des cookies strictement nécessaires à votre authentification (session Supabase).
          Aucun cookie publicitaire.{' '}
          <Link href="/politique-confidentialite" className="text-blue-400 hover:text-blue-300 underline">
            En savoir plus
          </Link>
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition"
          >
            Continuer sans accepter
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}

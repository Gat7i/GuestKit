'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()
  
  // 🔴 SOLUTION : NE PAS AFFICHER SUR LES PAGES ADMIN
  if (pathname?.startsWith('/admin')) {
    return null
  }
  
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      {/* ... votre code footer existant ... */}
    </footer>
  )
}
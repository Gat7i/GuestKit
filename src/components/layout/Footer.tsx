'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} The Orangers Beach Resort &amp; Bungalows — Hammamet, Tunisie
          </p>
          <nav className="flex gap-5 text-sm">
            <Link href="/politique-confidentialite" className="hover:text-white transition">
              Confidentialité
            </Link>
            <Link href="/cgu" className="hover:text-white transition">
              CGU
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

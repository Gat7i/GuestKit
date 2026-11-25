// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'  // ← CLIENT
import Footer from '@/components/layout/Footer'  // ← CLIENT
import CookieBanner from '@/components/layout/CookieBanner'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The Orangers Beach Resort & Bungalows',
  description: 'Votre compagnon de séjour à The Orangers Beach Resort & Bungalows — Hammamet, Tunisie',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'The Orangers Beach Resort & Bungalows',
    description: 'Votre compagnon de séjour à The Orangers Beach Resort & Bungalows — Hammamet, Tunisie',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'The Orangers Beach Resort & Bungalows' }],
  },
  twitter: {
    card: 'summary',
    title: 'The Orangers Beach Resort & Bungalows',
    description: 'Votre compagnon de séjour à The Orangers Beach Resort & Bungalows — Hammamet, Tunisie',
    images: ['/icon-512.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Header />  {/* ← CLIENT - Ne doit PAS être dans l'admin */}
        <main className="flex-grow pb-16 lg:pb-0">
          {children}
        </main>
        <Footer />  {/* ← CLIENT - Ne doit PAS être dans l'admin */}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  )
}
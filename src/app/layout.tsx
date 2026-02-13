// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'  // ← CLIENT
import Footer from '@/components/layout/Footer'  // ← CLIENT

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GuestKit - Hôtel Paradis',
  description: 'Votre application de séjour',
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
        <main className="flex-grow">
          {children}
        </main>
        <Footer />  {/* ← CLIENT - Ne doit PAS être dans l'admin */}
      </body>
    </html>
  )
}
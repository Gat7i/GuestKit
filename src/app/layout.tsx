// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'  // ← CLIENT
import Footer from '@/components/layout/Footer'  // ← CLIENT

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The Orangers Beach Resort & Bungalows',
  description: 'Votre compagnon de séjour à The Orangers Beach Resort & Bungalows — Hammamet, Tunisie',
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
      </body>
    </html>
  )
}
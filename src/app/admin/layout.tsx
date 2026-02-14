// src/app/admin/layout.tsx
import AdminHeader from '@/components/admin/AdminHeader'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header ADMIN uniquement */}
      <AdminHeader />
      
      {/* Contenu admin */}
      <main>
        {children}
      </main>
      
      {/* Footer admin simple */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-center text-sm text-gray-500">
            GuestsKit Admin • Hôtel Paradis
          </div>
        </div>
      </footer>
    </div>
  )
}
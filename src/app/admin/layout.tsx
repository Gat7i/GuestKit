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
      <AdminHeader />
      <main>
        {children}
      </main>
    </div>
  )
}
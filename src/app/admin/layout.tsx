// src/app/admin/layout.tsx

import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <main>{children}</main>
    </div>
  );
}

'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
}

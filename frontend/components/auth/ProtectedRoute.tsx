'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import type { components } from '@/lib/api/types';

type UserRole = components['schemas']['UserRole'];

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Rehydrate the store from localStorage
    const rehydrate = async () => {
      await useAuthStore.persist.rehydrate();
      setIsHydrated(true);
    };
    rehydrate();
  }, []);

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2" aria-hidden="true"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(pathname);
    router.replace(`/login?returnTo=${returnTo}`);
    return null;
  }

  // Check role-based access if allowedRoles is provided
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return (
        <div className="flex items-center justify-center min-h-screen" role="alert">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  // Render children if authenticated and role is allowed
  return <>{children}</>;
}

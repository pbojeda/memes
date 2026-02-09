'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoginForm } from '@/components/auth/LoginForm';

function LoginContent() {
  const searchParams = useSearchParams();
  const isFromRegistration = searchParams.get('registered') === 'true';
  const returnTo = searchParams.get('returnTo') || undefined;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFromRegistration && (
          <Alert>
            <AlertDescription>
              Registration successful! Please login with your credentials.
            </AlertDescription>
          </Alert>
        )}
        <LoginForm returnTo={returnTo} />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}

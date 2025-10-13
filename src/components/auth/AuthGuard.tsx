import React from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2Icon, LockIcon } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  redirectTo = '/auth/login',
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="w-5 h-5 animate-spin" />
          <span>Ładowanie...</span>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Redirect to login page instead of showing a card
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <LockIcon className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Wymagane logowanie</CardTitle>
            <CardDescription>
              Ta strona wymaga zalogowania się do konta
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Zaloguj się, aby uzyskać dostęp do tej funkcji
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => window.location.href = redirectTo}
                className="flex-1 sm:flex-none"
              >
                Zaloguj się
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/auth/register'}
                className="flex-1 sm:flex-none"
              >
                Utwórz konto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
};

// Higher-order component version
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <AuthGuard {...options}>
      <Component {...props} />
    </AuthGuard>
  );

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

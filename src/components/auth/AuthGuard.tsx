import React, { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { Loader2Icon } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  redirectTo = "/auth/login",
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Handle redirect using useEffect
  useEffect(() => {
    if (requireAuth && !isAuthenticated && !isLoading && typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
  }, [requireAuth, isAuthenticated, isLoading, redirectTo]);

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

    // Return null while redirect is happening
    return null;
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
};

// Higher-order component version
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, "children"> = {}
) => {
  const WrappedComponent = (props: P) => (
    <AuthGuard {...options}>
      <Component {...props} />
    </AuthGuard>
  );

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

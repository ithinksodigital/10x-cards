import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";

// Types for authentication context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: () => Promise<void>;
  signUpWithEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: () => Promise<void>;
  updatePassword: () => Promise<void>;
  migrateAnonymousData: (data: unknown) => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  initialSession?: Session | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialUser = null, initialSession = null }) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isLoading, setIsLoading] = useState(true);

  // Mock implementation - will be replaced with actual Supabase integration
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const signInWithEmail = async (): Promise<void> => {
    setIsLoading(true);
    // TODO: Implement actual Supabase sign in
    // Mock success
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // setUser(mockUser);
    // setSession(mockSession);
    setIsLoading(false);
  };

  const signUpWithEmail = async (): Promise<void> => {
    setIsLoading(true);
    // TODO: Implement actual Supabase sign up
    // Mock success
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // setUser(mockUser);
    // setSession(mockSession);
    setIsLoading(false);
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    // TODO: Implement actual Supabase sign out
    // Mock success
    await new Promise((resolve) => setTimeout(resolve, 500));
    setUser(null);
    setSession(null);
    setIsLoading(false);
  };

  const resetPassword = async (): Promise<void> => {
    // TODO: Implement actual Supabase password reset
    // Mock success
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const updatePassword = async (): Promise<void> => {
    // TODO: Implement actual Supabase password update
    // Mock success
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const migrateAnonymousData = async (): Promise<void> => {
    // TODO: Implement actual data migration
    // Mock success
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
    migrateAnonymousData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

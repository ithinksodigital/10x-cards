import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";

// Types for authentication context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  migrateAnonymousData: (anonymousData: unknown) => Promise<void>;
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

  const signInWithEmail = async (email: string, _password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement actual Supabase sign in
      console.log("Sign in with email:", email);
      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // setUser(mockUser);
      // setSession(mockSession);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement actual Supabase sign up
      console.log("Sign up with email:", email);
      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // setUser(mockUser);
      // setSession(mockSession);
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement actual Supabase sign out
      console.log("Sign out");
      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      // TODO: Implement actual Supabase password reset
      console.log("Reset password for email:", email);
      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  const updatePassword = async (password: string): Promise<void> => {
    try {
      // TODO: Implement actual Supabase password update
      console.log("Update password");
      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  };

  const migrateAnonymousData = async (anonymousData: unknown): Promise<void> => {
    try {
      // TODO: Implement actual data migration
      console.log("Migrate anonymous data:", anonymousData);
      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Migration error:", error);
      throw error;
    }
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

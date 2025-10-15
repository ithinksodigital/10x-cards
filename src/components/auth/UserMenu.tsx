import React, { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { UserIcon, LogOutIcon, SettingsIcon, ChevronDownIcon, Loader2Icon } from "lucide-react";

interface UserMenuProps {
  user?: {
    id?: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const { signOut, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email || "Użytkownik";
  const userEmail = user?.email || "";

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 h-auto"
      >
        <div className="flex items-center gap-2">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt={displayName} className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium truncate max-w-32">{displayName}</div>
            {user?.user_metadata?.full_name && userEmail && (
              <div className="text-xs text-muted-foreground truncate max-w-32">{userEmail}</div>
            )}
          </div>
        </div>
        <ChevronDownIcon className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <Card className="absolute right-0 top-full mt-2 w-64 z-50 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {/* User info */}
                <div className="px-3 py-2 border-b border-border">
                  <div className="flex items-center gap-3">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt={displayName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Navigate to profile/settings
                    console.log("Navigate to profile");
                  }}
                >
                  <SettingsIcon className="w-4 h-4" />
                  Ustawienia
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <LogOutIcon className="w-4 h-4" />}
                  Wyloguj się
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

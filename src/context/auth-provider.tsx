
'use client';

import * as React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { getUserProfile } from '@/services/userService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  is2faPending: boolean;
  setIs2faPending: (isPending: boolean) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/welcome'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [is2faPending, setIs2faPending] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
            const profile = await getUserProfile();
            setUserProfile(profile);
            // This is a failsafe. If a user was in a 2FA pending state from a previous session,
            // but then disabled it elsewhere, this ensures the state is reset on a fresh auth check.
            if (is2faPending && profile && !profile.twoFactorEnabled) {
              setIs2faPending(false);
            }
        } catch (error) {
            console.error("Failed to fetch user profile in auth provider", error);
            setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        setIs2faPending(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [is2faPending]);

  React.useEffect(() => {
    if (isLoading) {
      return; // Don't do anything while auth state is loading
    }
    
    const isPublicRoute = publicRoutes.includes(pathname);
    const isFullyAuthenticated = user && !is2faPending;

    // If the user is fully authenticated and on a public route, redirect them to the dashboard.
    if (isFullyAuthenticated && isPublicRoute) {
      router.push('/');
      return;
    }

    // If the user is NOT fully authenticated (not logged in, OR pending 2FA)
    // and they are trying to access a protected route, send them to login.
    if (!isFullyAuthenticated && !isPublicRoute) {
      router.push('/login');
      return;
    }

  }, [user, isLoading, pathname, router, is2faPending]);
  

  const value = { user, userProfile, isLoading, is2faPending, setIs2faPending };

  if (isLoading) {
     return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Wallet className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

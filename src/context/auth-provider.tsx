
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
            // If the user logs in but their 2FA is still pending from a previous session,
            // ensure the state is reset correctly. This happens on first load.
            if (is2faPending && profile && !profile.twoFactorEnabled) {
              setIs2faPending(false);
            }
        } catch (error) {
            console.error("Failed to fetch user profile in auth provider", error);
            setUserProfile(null);
        }
      } else {
        // Not logged in, so clear all user state.
        setUserProfile(null);
        setIs2faPending(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [is2faPending]); // Add is2faPending to dependencies

  React.useEffect(() => {
    if (isLoading) {
      return; // Don't do anything while auth state is loading
    }

    const isPublicRoute = publicRoutes.includes(pathname);

    // Scenario 1: 2FA is pending. User must be on the login page.
    if (is2faPending && pathname !== '/login') {
      router.push('/login');
      return;
    }

    // Scenario 2: User is not logged in and is trying to access a protected route.
    if (!user && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // Scenario 3: User is fully logged in and is on a public route.
    if (user && !is2faPending && isPublicRoute) {
      router.push('/');
      return;
    }

  }, [user, isLoading, pathname, router, is2faPending]);
  

  const value = { user, userProfile, isLoading, is2faPending, setIs2faPending };

  // This is the loading state for the initial auth check
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

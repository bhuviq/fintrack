
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
  }, []);

  React.useEffect(() => {
    if (isLoading) {
      return; // Don't do anything while auth state is loading
    }

    const isPublicRoute = publicRoutes.includes(pathname);

    // If user is not logged in and trying to access a protected route, redirect to login
    if (!user && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // If user is logged in (but not pending 2FA) and on a public route, redirect to dashboard
    if (user && !is2faPending && isPublicRoute) {
      router.push('/');
      return;
    }
    
    // If 2FA is pending, the only allowed page is /login. Force redirect.
    if (is2faPending && pathname !== '/login') {
      router.push('/login');
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

  // This is the key security check. If 2FA is pending, we only render children
  // if the user is on the login page. Otherwise, we render nothing, preventing
  // access to any other part of the app. The useEffect above will handle the redirect.
  const canRenderChildren = !is2faPending || pathname === '/login';

  return (
    <AuthContext.Provider value={value}>
      {canRenderChildren ? children : null}
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

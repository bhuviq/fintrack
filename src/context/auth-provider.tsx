
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
      return; // Wait for auth state to load
    }

    const isPublicRoute = publicRoutes.includes(pathname);

    if (is2faPending && pathname !== '/login') {
      // If 2FA is pending, the ONLY allowed page is /login. Force redirect.
      router.push('/login');
    } else if (user && !is2faPending && isPublicRoute) {
      // If user is logged in (and not in 2FA flow) and on a public route, redirect to dashboard.
      router.push('/');
    } else if (!user && !isPublicRoute) {
      // If user is not logged in and on a protected route, redirect to login.
      router.push('/login');
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

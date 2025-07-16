
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
    if (isLoading) return;

    const isPublic = publicRoutes.includes(pathname);
    
    // If auth is loading, don't do anything yet.
    if (!isLoading) {
      // If there's no user, and they are not on a public route, redirect to login.
      if (!user && !isPublic) {
        router.push('/login');
      }
      // If there IS a user, but they are on a public route, and 2FA is NOT pending, redirect to dashboard.
      else if (user && isPublic && !is2faPending) {
        router.push('/');
      }
      // If 2FA IS pending, but they are not on the login page, force them to the login page.
      else if (is2faPending && pathname !== '/login') {
        router.push('/login');
      }
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

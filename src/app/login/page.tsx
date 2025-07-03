
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Wallet, AlertTriangle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';

// Google SVG Icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    {...props}
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.533,44,30.169,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

export default function LoginPage() {
  const isFirebaseConfigured =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('YOUR_');

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }
    // This listener handles redirecting users who are already authenticated
    // when they land on the login page. It will not interfere with the
    // new user sign-up flow.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isSigningIn) {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, isFirebaseConfigured, isSigningIn]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        // Existing user, go to dashboard
        router.push('/');
      } else {
        // New user, create profile and go to welcome page
        const [firstName, ...lastNameParts] =
          user.displayName?.split(' ') || ['', ''];
        const lastName = lastNameParts.join(' ');

        const newProfile: Partial<UserProfile> = {
          id: user.uid,
          firstName: firstName || '',
          lastName: lastName || '',
          email: user.email!,
          avatarUrl: user.photoURL || '',
        };
        await setDoc(userDocRef, newProfile);
        router.push('/welcome');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the sign-in popup. This is not an error we need to show.
        console.log('Sign-in popup closed by user.');
      } else {
        console.error('Google Sign-In Error:', error);
        let description = error.message;
        if (error.code === 'auth/unauthorized-domain') {
          description =
            "This domain is not authorized for authentication. Please add it to your Firebase project's authorized domains.";
        }
        toast({
          variant: 'destructive',
          title: 'Sign-In Failed',
          description: description,
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="flex min-h-screen items-start justify-center bg-background p-4 pt-20 sm:pt-32">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Firebase Not Configured</CardTitle>
            <CardDescription>
              Please add your Firebase project credentials to the{' '}
              <code>.env</code> file at the root of your project to enable
              authentication.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Wallet className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-background p-4 pt-20 sm:pt-32">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to FinTrack</CardTitle>
          <CardDescription>
            Sign up or log in with Google to manage your finances.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
          >
            <GoogleIcon className="mr-2" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

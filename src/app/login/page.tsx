
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { authenticator } from 'otplib';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, AlertTriangle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { createUserProfileAndSeedData } from '@/services/userService';

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
  const firebaseConfigVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const isFirebaseConfigured =
    Object.values(firebaseConfigVars).every(Boolean) &&
    !firebaseConfigVars.apiKey?.includes('YOUR_');

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [loginStep, setLoginStep] = React.useState<'initial' | '2fa'>('initial');
  const [otp, setOtp] = React.useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [tempProfile, setTempProfile] = React.useState<UserProfile | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If user is logged in but not in the middle of a 2FA flow, redirect.
      if (user && !isSigningIn && loginStep === 'initial') {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, isFirebaseConfigured, isSigningIn, loginStep]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const profile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
        if (profile.twoFactorEnabled && profile.twoFactorSecret) {
          // 2FA is enabled, prompt for code
          setTempProfile(profile);
          setLoginStep('2fa');
        } else {
          // Existing user, no 2FA, go to dashboard
          router.push('/');
        }
      } else {
        // New user, create profile and seed data, then go to welcome page
        await createUserProfileAndSeedData(user);
        router.push('/welcome');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
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

  const handleVerifyOtp = async () => {
    if (!otp || !tempProfile?.twoFactorSecret) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const isValid = authenticator.verify({ token: otp, secret: tempProfile.twoFactorSecret });
      if (isValid) {
        toast({ title: 'Success', description: 'You have been successfully signed in.' });
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid Code',
          description: 'The code is incorrect. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred during verification.',
      });
    } finally {
      setIsVerifyingOtp(false);
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
              <code>.env.dev</code> file at the root of your project to enable
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
          <CardTitle className="text-2xl">
            {loginStep === '2fa' ? 'Two-Factor Authentication' : 'Welcome to FinTrack'}
          </CardTitle>
          <CardDescription>
            {loginStep === '2fa'
              ? 'Enter the 6-digit code from your authenticator app to continue.'
              : 'Sign up or log in with Google to manage your finances.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loginStep === 'initial' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
            >
              <GoogleIcon className="mr-2" />
              Continue with Google
            </Button>
          )}

          {loginStep === '2fa' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-code">Verification Code</Label>
                <Input
                  id="otp-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="text-center tracking-widest"
                  maxLength={6}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleVerifyOtp();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otp.length !== 6}
                className="w-full"
              >
                {isVerifyingOtp ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

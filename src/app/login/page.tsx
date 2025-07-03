'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  type ConfirmationResult,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const [step, setStep] = React.useState<'credentials' | 'otp'>('credentials');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [confirmationResult, setConfirmationResult] =
    React.useState<ConfirmationResult | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const recaptchaContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }
    // Redirect if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, isFirebaseConfigured]);

  React.useEffect(() => {
    if (!isFirebaseConfigured || typeof window === 'undefined' || window.recaptchaVerifier) {
      return;
    }
    // This is to ensure the reCAPTCHA verifier is only created once and is ready when needed.
    if (recaptchaContainerRef.current) {
        try {
            window.recaptchaVerifier = new RecaptchaVerifier(
                auth,
                recaptchaContainerRef.current,
                {
                size: 'invisible',
                }
            );
        } catch (error) {
            console.error("Error initializing RecaptchaVerifier", error);
            toast({
                variant: "destructive",
                title: "reCAPTCHA Error",
                description: "Failed to initialize reCAPTCHA. Please refresh the page.",
            });
        }
    }
  }, [isFirebaseConfigured, toast]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists, if not, create one
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        const [firstName, ...lastNameParts] =
          user.displayName?.split(' ') || ['', ''];
        const lastName = lastNameParts.join(' ');

        const newProfile: UserProfile = {
          id: user.uid,
          firstName: firstName || 'New',
          lastName: lastName || 'User',
          email: user.email!,
          avatarUrl: user.photoURL || '',
        };
        await setDoc(userDocRef, newProfile, { merge: true });
      }
      router.push('/');
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign-In Failed',
        description: error.message,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Phone Number',
        description:
          'Please enter the number in E.164 format (e.g., +1234567890).',
      });
      return;
    }
    setIsSigningIn(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (error: any) {
      console.error('Phone Sign-In Error:', error);
      toast({
        variant: 'destructive',
        title: 'SMS Sending Failed',
        description:
          'Could not send OTP. Please check the phone number or try again later.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setIsSigningIn(true);
    try {
      await confirmationResult.confirm(otp);
      // Phone sign-in doesn't provide user details, a default profile will be created by the service if needed.
      router.push('/');
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      toast({
        variant: 'destructive',
        title: 'Invalid OTP',
        description: 'The code you entered is incorrect. Please try again.',
      });
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
      <div ref={recaptchaContainerRef} id="recaptcha-container"></div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'credentials'
              ? 'Welcome to FinTrack'
              : 'Check your phone'}
          </CardTitle>
          <CardDescription>
            {step === 'credentials'
              ? 'Sign in to manage your finances.'
              : `We've sent a one-time password to ${phoneNumber}.`}
          </CardDescription>
        </CardHeader>

        {step === 'credentials' ? (
          <>
            <CardContent className="space-y-4 pt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
              >
                <GoogleIcon className="mr-2" />
                Sign in with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <form onSubmit={handlePhoneSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 890"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isSigningIn}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  Send OTP
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  required
                  placeholder="_ _ _ _ _ _"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isSigningIn}
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isSigningIn}
              >
                Verify & Continue
              </Button>
              <Button
                variant="link"
                size="sm"
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setOtp('');
                }}
                disabled={isSigningIn}
              >
                Go Back
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

// Add recaptchaVerifier to the window object for persistence between renders
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

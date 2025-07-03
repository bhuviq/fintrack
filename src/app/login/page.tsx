'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = React.useState<'credentials' | 'otp'>('credentials');

  // Login states
  const [loginIdentifier, setLoginIdentifier] = React.useState('');

  // Signup states
  const [signupEmail, setSignupEmail] = React.useState('');
  const [signupPhone, setSignupPhone] = React.useState('');

  const [otp, setOtp] = React.useState('');
  const router = useRouter();

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send an OTP here based on the form submitted.
    console.log(`Sending OTP...`);
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd verify the OTP here.
    console.log(`Verifying OTP ${otp}`);
    router.push('/');
  };

  const getOtpMessage = () => {
    // If the login identifier was used, we assume OTP is sent to the associated email.
    if (loginIdentifier) {
      return `We've sent a one-time password to the email associated with your account.`;
    }
    // Otherwise, it must be a signup flow.
    return `We've sent a one-time password to ${signupEmail}.`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'credentials' ? 'Welcome to FinTrack' : 'Check your email'}
          </CardTitle>
          <CardDescription>
            {step === 'credentials'
              ? 'Login or create an account to manage your finances.'
              : getOtpMessage()}
          </CardDescription>
        </CardHeader>

        {step === 'credentials' ? (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSendOtp}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="loginIdentifier">Email or Phone Number</Label>
                    <Input
                      id="loginIdentifier"
                      placeholder="name@example.com or +1234567890"
                      required
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        // Clear signup fields when user types in login
                        setSignupEmail('');
                        setSignupPhone('');
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">
                    Send OTP
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSendOtp}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        // Clear login field when user types in signup
                        setLoginIdentifier('');
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+1 234 567 890"
                      required
                      value={signupPhone}
                      onChange={(e) => {
                        setSignupPhone(e.target.value);
                        // Clear login field when user types in signup
                        setLoginIdentifier('');
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">
                    Sign Up & Verify Email
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
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
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full">
                Verify & Continue
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setStep('credentials');
                  setOtp('');
                }}
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

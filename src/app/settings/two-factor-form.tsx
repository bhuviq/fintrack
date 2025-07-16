
'use client';

import * as React from 'react';
import { authenticator } from 'otplib';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { updateUserProfile } from '@/services/userService';

interface TwoFactorFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userProfile: UserProfile | null;
  onSuccess: () => void;
}

export function TwoFactorForm({ isOpen, onOpenChange, userProfile, onSuccess }: TwoFactorFormProps) {
  const [secret, setSecret] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen && userProfile) {
      const newSecret = authenticator.generateSecret();
      setSecret(newSecret);
      const serviceName = `${process.env.NODE_ENV ==='production' ? 'FinTrack-' : 'Demo-'}Light2Glow`;
      const otpAuthUrl = authenticator.keyuri(userProfile.email || 'user', serviceName, newSecret);
      setQrCodeUrl(otpAuthUrl);
      setOtp('');
    }
  }, [isOpen, userProfile]);

  const handleVerify = async () => {
    if (!otp) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Please enter the code from your authenticator app.',
      });
      return;
    }

    try {
      const isValid = authenticator.verify({ token: otp, secret });

      if (isValid) {
        await updateUserProfile({
          twoFactorEnabled: true,
          twoFactorSecret: secret,
        });
        toast({
          title: 'Success',
          description: 'Two-Factor Authentication has been enabled.',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: 'The code is incorrect. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Scan the QR code with your authenticator app (e.g., Google Authenticator) and enter the code to verify.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="p-4 bg-white inline-block">
            {qrCodeUrl && <QRCode value={qrCodeUrl} size={160} />}
          </div>
          <div>
            <Label htmlFor="secret-key">Can't scan? Enter this key manually:</Label>
            <Input id="secret-key" readOnly value={secret} className="mt-2 font-mono text-center tracking-widest" />
          </div>
          <div className="w-full max-w-xs">
            <Label htmlFor="otp-code">Verification Code</Label>
            <Input
              id="otp-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              className="mt-2 text-center"
              maxLength={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleVerify}>Verify & Enable</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

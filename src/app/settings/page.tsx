'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Mail, Smartphone, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and profile settings.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
             <Avatar className="h-20 w-20">
                <AvatarImage src="https://placehold.co/80x80.png" alt="User" data-ai-hint="person avatar" />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <Button variant="outline">Change Photo</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="User" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="user@fintrack.com" disabled />
          </div>
           <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="e.g. +1 234 567 890" />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
                Add an extra layer of security to your account. It is highly recommended.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-4">
                    <Smartphone className="h-6 w-6 text-muted-foreground mt-1" />
                    <div>
                        <Label htmlFor="sms-auth" className="font-medium leading-none">SMS / Text Message</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            Receive a verification code via text message.
                        </p>
                    </div>
                </div>
                <Switch id="sms-auth" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-muted-foreground mt-1" />
                    <div>
                        <Label htmlFor="email-auth" className="font-medium leading-none">Email</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                           Receive a verification code via email.
                        </p>
                    </div>
                </div>
                <Switch id="email-auth" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-muted-foreground mt-1" />
                    <div>
                        <Label htmlFor="authenticator-app" className="font-medium leading-none">Authenticator App</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            Use an app like Google Authenticator or Authy.
                        </p>
                    </div>
                </div>
                <Switch id="authenticator-app" />
            </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password. It is recommended to use a strong password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Update Password</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

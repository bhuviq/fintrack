
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Mail, Smartphone, ShieldCheck } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '@/services/userService';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast"
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';


export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
    } catch (error: any) {
        console.error("Failed to fetch profile:", error);
        toast({
            variant: "destructive",
            title: "Network Error",
            description: "Could not load user profile. You might be offline.",
        })
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProfile();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, fetchProfile]);
  

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && profile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({...profile, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePhotoClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (profile) {
        setProfile({ ...profile, [id]: value });
    }
  }

  const handleSaveChanges = async () => {
    if (!profile) return;
    try {
        await updateUserProfile({
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatarUrl: profile.avatarUrl,
            phone: profile.phone,
        });
        toast({
            title: "Success",
            description: "Your profile has been updated.",
        })
    } catch (error) {
        console.error("Failed to save changes:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save profile changes.",
        })
    }
  }

  if(isLoading || !profile) {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                        <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                    </div>
                    <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4"><Skeleton className="h-10 w-28" /></CardFooter>
            </Card>
        </div>
    )
  }

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
              <AvatarImage
                src={profile.avatarUrl || `https://placehold.co/80x80.png`}
                alt="User"
                data-ai-hint="person avatar"
              />
              <AvatarFallback>{profile.firstName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
              accept="image/*"
            />
            <Button variant="outline" onClick={handleChangePhotoClick}>
              Change Photo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={profile.firstName} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={profile.lastName} onChange={handleInputChange} />
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={profile.phone || ''} onChange={handleInputChange} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account. It is highly
            recommended.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-4">
              <Smartphone className="h-6 w-6 text-muted-foreground mt-1" />
              <div>
                <Label htmlFor="sms-auth" className="font-medium leading-none">
                  SMS / Text Message
                </Label>
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
                <Label htmlFor="email-auth" className="font-medium leading-none">
                  Email
                </Label>
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
                <Label
                  htmlFor="authenticator-app"
                  className="font-medium leading-none"
                >
                  Authenticator App
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Use an app like Google Authenticator or Authy.
                </p>
              </div>
            </div>
            <Switch id="authenticator-app" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

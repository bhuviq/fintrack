
'use client';

import * as React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { InstallPwaButton } from './install-pwa-button';
import { useAuth } from '@/context/auth-provider';

export function AppContent({ children }: { children: React.ReactNode }) {
  const { user, is2faPending } = useAuth();
  
  // This is the security gate.
  // If a user is logged in but their 2FA is still pending, they are not fully authenticated.
  // We must not render the main app layout (sidebar, header, etc.).
  // Instead, we let the page router render the appropriate page (which will be the login page).
  const isFullyAuthenticated = user && !is2faPending;

  if (isFullyAuthenticated) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="p-4 sm:p-6 lg:p-8 bg-background">{children}</main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    );
  }

  // For unauthenticated users or users pending 2FA, render only the children and the toaster.
  // The InstallPwaButton is placed in a div to allow for positioning on pages like the login screen.
  return (
    <>
      <div className="absolute top-4 right-4 z-50">
        <InstallPwaButton />
      </div>
      {children}
      <Toaster />
    </>
  );
}

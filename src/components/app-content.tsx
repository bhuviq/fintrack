'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/welcome';

  return isAuthPage ? (
    <>
      {children}
      <Toaster />
    </>
  ) : (
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


'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/welcome';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>FinTrack</title>
        <meta name="description" content="Your personal finance tracker." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {isAuthPage ? (
          <>
            {children}
            <Toaster />
          </>
        ) : (
          <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <Header />
                <main className="p-4 sm:p-6 lg:p-8 bg-background">
                  {children}
                </main>
              </SidebarInset>
            <Toaster />
          </SidebarProvider>
        )}
      </body>
    </html>
  );
}

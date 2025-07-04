
import './globals.css';
import { CurrencyProvider } from '@/context/currency-provider';
import { AppContent } from '@/components/app-content';
import * as React from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <meta name="theme-color" content="#2780de" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased">
        <CurrencyProvider>
          <AppContent>{children}</AppContent>
        </CurrencyProvider>
      </body>
    </html>
  );
}

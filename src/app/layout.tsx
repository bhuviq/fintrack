
import './globals.css';
import { CurrencyProvider } from '@/context/currency-provider';
import { AuthProvider } from '@/context/auth-provider';
import { AppContent } from '@/components/app-content';
import * as React from 'react';
import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Splitzy</title>
        <meta name="description" content="Your personal finance tracker." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%235DADE2'/></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#5DADE2" />
        <link rel="manifest" href="/manifest.json" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2213497241102382"
     crossOrigin="anonymous"></script>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
            <Script
                async
                src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />
        )}
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <CurrencyProvider>
            <AppContent>{children}</AppContent>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

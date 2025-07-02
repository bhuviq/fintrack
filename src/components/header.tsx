'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const pageTitles: { [key: string]: string } = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/investments': 'Investments',
  '/budgets': 'Budgets',
  '/goals': 'Goals',
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'FinTrack';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      {pathname === '/transactions' && (
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      )}
    </header>
  );
}

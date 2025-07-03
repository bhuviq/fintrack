
'use client';

import * as React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/services/userService';
import type { Currency } from '@/lib/types';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = React.createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = React.useState<Currency>('USD');
  
  React.useEffect(() => {
    // Only run on client
    if (typeof window !== 'undefined') {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
            const userProfile = await getUserProfile();
            if (userProfile && userProfile.currency) {
                setCurrencyState(userProfile.currency);
            }
            } catch (error) {
            console.error("Failed to fetch user profile for currency context", error);
            }
        }
        });
        return () => unsubscribe();
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const formatCurrency = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [currency]);

  const value = { currency, setCurrency, formatCurrency };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
    const context = React.useContext(CurrencyContext);
    if (context === undefined) {
      throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}

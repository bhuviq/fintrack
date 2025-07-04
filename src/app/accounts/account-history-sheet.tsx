'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import type { Account, Transaction, Currency } from '@/lib/types';
import { useCurrency } from '@/context/currency-provider';

interface AccountHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  account: Account | null;
  transactions: Transaction[];
  accountMap: Map<string, Account>;
}

export function AccountHistorySheet({
  isOpen,
  onOpenChange,
  account,
  transactions,
  accountMap,
}: AccountHistorySheetProps) {
  
  const { formatCurrency: formatGlobalCurrency } = useCurrency();

  const filteredTransactions = React.useMemo(() => {
    if (!account) return [];
    return transactions
      .filter(t => t.accountId === account.id || t.toAccountId === account.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [account, transactions]);

  if (!account) {
    return null;
  }
  
  const formatAmount = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>History for {account.name}</SheetTitle>
          <SheetDescription>View all transactions associated with this account.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          {filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  let isCredit = false;
                  if (transaction.type === 'income' && transaction.accountId === account?.id) isCredit = true;
                  if (transaction.type === 'transfer' && transaction.toAccountId === account?.id) isCredit = true;
                  
                  const getIcon = () => {
                    if (isCredit) {
                      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900"><ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" /></div>;
                    }
                    return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900"><ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" /></div>;
                  };

                  const getAmountColor = () => isCredit ? 'text-green-600' : 'text-red-600';
                  const getPrefix = () => isCredit ? '+' : '-';
                  
                  const fromAccount = accountMap.get(transaction.accountId);
                  const toAccount = transaction.toAccountId ? accountMap.get(transaction.toAccountId) : null;
                  const currency = fromAccount?.currency || account.currency;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getIcon()}
                          <div>
                            <div className="font-medium">
                              {transaction.description}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.type === 'transfer' ? `Transfer ${isCredit ? 'from' : 'to'} ${isCredit ? fromAccount?.name : toAccount?.name}` : transaction.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getAmountColor()}`}>
                        {getPrefix()}
                        {formatAmount(transaction.amount, currency)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg mt-4">
                <p className="text-muted-foreground">No transactions yet.</p>
                <p className="text-sm text-muted-foreground">This account has no transaction history.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

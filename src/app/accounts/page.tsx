
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, PlusCircle, Edit, Trash2, History } from 'lucide-react';
import { AccountForm, type AccountFormValues } from './account-form';
import { AccountHistorySheet } from './account-history-sheet';
import { Progress } from '@/components/ui/progress';
import { getAccounts, addAccount, updateAccount, deleteAccount } from '@/services/accountService';
import { getTransactions, deleteTransaction } from '@/services/transactionService';
import type { Account, Transaction, NewAccount, Currency } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [accountToDelete, setAccountToDelete] = React.useState<Account | null>(null);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = React.useState(false);
  const [historyAccount, setHistoryAccount] = React.useState<Account | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedAccounts, fetchedTransactions] = await Promise.all([
            getAccounts(),
            getTransactions(),
        ]);
        setAccounts(fetchedAccounts);
        setTransactions(fetchedTransactions);
    } catch (error: any) {
        console.error("Failed to fetch data:", error);
        toast({
            variant: "destructive",
            title: "Network Error",
            description: "Could not connect to the database. Please check your internet connection and Firebase configuration.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, fetchData]);

  const accountMap = React.useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);

  const accountsWithCurrentBalance = React.useMemo(() => {
    return accounts.map(account => {
        const balanceDate = new Date(account.balanceDate);
        
        const transactionTotal = transactions.reduce((total, t) => {
            const transactionDate = new Date(t.date);
            if (transactionDate < balanceDate) {
                return total; // Ignore transactions before the opening balance date
            }

            // Credits to the account (money in)
            if (t.accountId === account.id && t.type === 'income') {
                return total + t.amount;
            }
            if (t.toAccountId === account.id && t.type === 'transfer') {
                 return total + t.amount;
            }

            // Debits from the account (money out)
            if (t.accountId === account.id && (t.type === 'expense' || t.type === 'transfer')) {
                return total - t.amount;
            }
            
            return total;
        }, 0);
        
        const currentBalance = account.openingBalance + transactionTotal;
        return { ...account, currentBalance };
    });
  }, [accounts, transactions]);


  const bankAccounts = accountsWithCurrentBalance.filter(acc => acc.type === 'bank');
  const creditCardAccounts = accountsWithCurrentBalance.filter(acc => acc.type === 'credit-card');

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsSheetOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsSheetOpen(true);
  };
  
  const handleViewHistory = (account: Account) => {
    setHistoryAccount(account);
    setIsHistorySheetOpen(true);
  };

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (accountToDelete) {
        try {
            // Firestore doesn't have cascading deletes, so we manually delete associated transactions.
            const associatedTransactions = transactions.filter(t => t.accountId === accountToDelete.id || t.toAccountId === accountToDelete.id);
            await Promise.all(associatedTransactions.map(t => deleteTransaction(t.id)));
            
            await deleteAccount(accountToDelete.id);
            await fetchData();
        } catch (error) {
            console.error("Failed to delete account and associated transactions:", error);
        }
    }
    setDeleteAlertOpen(false);
    setAccountToDelete(null);
  };

  const handleSaveAccount = async (data: Omit<AccountFormValues, 'id' | 'balanceDate'> & { id?: string; balanceDate: string }) => {
    try {
        const { ...accountData } = data;
        const newAccountData: NewAccount = {
          name: accountData.name,
          type: accountData.type,
          openingBalance: accountData.openingBalance,
          balanceDate: accountData.balanceDate,
          currency: accountData.currency,
          limit: accountData.limit,
          dueDate: accountData.dueDate
        };

        if (editingAccount) {
            await updateAccount(editingAccount.id, newAccountData);
        } else {
            await addAccount(newAccountData);
        }
        await fetchData();
    } catch (error) {
        console.error("Failed to save account:", error);
    }
    setIsSheetOpen(false);
    setEditingAccount(null);
  };

  const formatAmount = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatBalance = (balance: number, currency: Currency) => {
    const color = balance >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={color}>{formatAmount(balance, currency)}</span>
  }
  
  const getProgressColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-40" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(2)].map((_, i) => <Card key={i} className="h-[250px]"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-full w-full" /></CardContent></Card>)}
            </div>
             <Skeleton className="h-10 w-40 mt-8" />
             <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {[...Array(2)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                                    <TableCell><MoreHorizontal className="h-4 w-4" /></TableCell>
                                </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts and credit cards.
          </p>
        </div>
        <Button onClick={handleAddAccount}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Credit Cards</h2>
          {creditCardAccounts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {creditCardAccounts.map((account) => {
                 if (account.type !== 'credit-card') return null;
                 const utilization = account.limit ? (Math.abs(account.currentBalance) / account.limit) * 100 : 0;
                return (
                  <Card key={account.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className='pr-10'>{account.name}</CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleViewHistory(account)}>
                                    <History className="mr-2 h-4 w-4" />
                                    View History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAccount(account)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding</p>
                        <p className="text-2xl font-bold">{formatAmount(Math.abs(account.currentBalance), account.currency)}</p>
                        <p className="text-sm text-muted-foreground">of {formatAmount(account.limit || 0, account.currency)} limit</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Utilization</span>
                          <span className="font-medium">{utilization.toFixed(0)}%</span>
                        </div>
                        <Progress value={utilization} indicatorClassName={getProgressColor(utilization)} />
                      </div>
                    </CardContent>
                    <CardDescription className="p-6 pt-0 text-xs">
                        Next payment due on the {account.dueDate}{account.dueDate === 1 ? 'st' : account.dueDate === 2 ? 'nd' : account.dueDate === 3 ? 'rd' : 'th'} of each month.
                    </CardDescription>
                  </Card>
                )
              })}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No credit cards added yet.</p>
                <p className="text-sm text-muted-foreground">Add a credit card to get started!</p>
            </div>
          )}
        </div>

        <div>
           <h2 className="text-xl font-bold mb-4">Bank Accounts</h2>
           {bankAccounts.length > 0 ? (
            <Card>
                <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bankAccounts.map((account) => (
                            <TableRow key={account.id}>
                                <TableCell className="font-medium">{account.name}</TableCell>
                                <TableCell>
                                    <Badge variant={'secondary'}>Bank Account</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatBalance(account.currentBalance, account.currency)}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleViewHistory(account)}>
                                                <History className="mr-2 h-4 w-4" />
                                                View History
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAccount(account)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
           ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No bank accounts added yet.</p>
                <p className="text-sm text-muted-foreground">Add a bank account to get started!</p>
            </div>
           )}
        </div>
      </div>

      <AccountForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        account={editingAccount}
        onSubmit={handleSaveAccount}
      />
      
      <AccountHistorySheet
        isOpen={isHistorySheetOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setHistoryAccount(null);
          setIsHistorySheetOpen(isOpen);
        }}
        account={historyAccount}
        transactions={transactions}
        accountMap={accountMap}
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this account and all associated transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

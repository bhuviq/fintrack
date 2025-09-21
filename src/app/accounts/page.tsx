
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, History, Archive, ArchiveRestore } from 'lucide-react';
import { AccountForm, type AccountFormValues } from './account-form';
import { AccountHistorySheet } from './account-history-sheet';
import { Progress } from '@/components/ui/progress';
import { getAccounts, addAccount, updateAccount, deleteAccount } from '@/services/accountService';
import { getTransactions } from '@/services/transactionService';
import type { Account, Transaction, NewAccount, Currency } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
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
        const [fetchedAccounts, { transactions: fetchedTransactions }] = await Promise.all([
            getAccounts(),
            getTransactions({ filters: {} }),
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
    if (user) {
        fetchData();
    }
  }, [user, fetchData]);

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
            if (t.accountId === account.id && (t.type === 'expense' || t.type === 'transfer' || t.type === 'investment')) {
                return total - t.amount;
            }
            
            return total;
        }, 0);
        
        const currentBalance = account.openingBalance + transactionTotal;
        return { ...account, currentBalance };
    });
  }, [accounts, transactions]);

  const activeAccounts = accountsWithCurrentBalance.filter(acc => acc.status === 'active');
  const archivedAccounts = accountsWithCurrentBalance.filter(acc => acc.status === 'inactive');

  const bankAccounts = activeAccounts.filter(acc => acc.type === 'bank');
  const creditCardAccounts = activeAccounts.filter(acc => acc.type === 'credit-card');
  const brokerAccounts = activeAccounts.filter(acc => acc.type === 'broker');

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
  
  const handleToggleArchive = async (account: Account) => {
    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAccount(account.id, { status: newStatus });
      toast({
        title: "Success",
        description: `Account has been ${newStatus === 'inactive' ? 'archived' : 'unarchived'}.`
      });
      fetchData(); // Refetch to update UI
    } catch(e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem updating the account status."
      });
    }
  }

  const confirmDelete = async () => {
    if (accountToDelete) {
        try {
            // Firestore doesn't have cascading deletes, so we manually delete associated transactions.
            const associatedTransactions = transactions.filter(t => t.accountId === accountToDelete.id || t.toAccountId === accountToDelete.id);
            // This is not fully implemented yet in transactionService
            // await Promise.all(associatedTransactions.map(t => deleteTransaction(t.id, t.type, t.investmentId)));
            
            await deleteAccount(accountToDelete.id);
            await fetchData();
        } catch (error) {
            console.error("Failed to delete account and associated transactions:", error);
        }
    }
    setDeleteAlertOpen(false);
    setAccountToDelete(null);
  };

  const handleSaveAccount = async (data: AccountFormValues) => {
    try {
        const { id, ...accountData } = data;

        const newAccountData: NewAccount = {
            ...accountData,
            balanceDate: format(data.balanceDate, 'yyyy-MM-dd')
        };
        
        if (id) {
            await updateAccount(id, newAccountData);
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
  
  const getBadgeForType = (type: Account['type']) => {
    switch (type) {
      case 'bank': return <Badge variant={'secondary'}>Bank Account</Badge>;
      case 'credit-card': return <Badge variant={'destructive'}>Credit Card</Badge>;
      case 'broker': return <Badge className='bg-indigo-500 text-white'>Broker Account</Badge>;
    }
  }

  const renderAccountActions = (account: Account) => (
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => handleViewHistory(account)}>
        <History className="mr-2 h-4 w-4" />
        View History
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleEditAccount(account)} disabled={account.status === 'inactive'}>
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
       <DropdownMenuItem onClick={() => handleToggleArchive(account)}>
        {account.status === 'active' ? <Archive className="mr-2 h-4 w-4" /> : <ArchiveRestore className="mr-2 h-4 w-4" />}
        {account.status === 'active' ? 'Archive' : 'Unarchive'}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAccount(account)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

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

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived ({archivedAccounts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-8">
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
                                {renderAccountActions(account)}
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
                    <p className="text-muted-foreground">No active credit cards.</p>
                </div>
            )}
            </div>

            <div>
            <h2 className="text-xl font-bold mb-4">Cash & Investment Accounts</h2>
            {[...bankAccounts, ...brokerAccounts].length > 0 ? (
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
                            {[...bankAccounts, ...brokerAccounts].sort((a,b) => a.name.localeCompare(b.name)).map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>
                                        {getBadgeForType(account.type)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{formatBalance(account.currentBalance, account.currency)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            {renderAccountActions(account)}
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
                    <p className="text-muted-foreground">No active bank or broker accounts.</p>
                </div>
            )}
            </div>
        </TabsContent>
        <TabsContent value="archived">
            <Card>
                <CardHeader>
                    <CardTitle>Archived Accounts</CardTitle>
                    <CardDescription>These accounts are inactive and hidden from other views.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {archivedAccounts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Last Balance</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {archivedAccounts.sort((a,b) => a.name.localeCompare(b.name)).map((account) => (
                                    <TableRow key={account.id}>
                                        <TableCell className="font-medium">{account.name}</TableCell>
                                        <TableCell>{getBadgeForType(account.type)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatBalance(account.currentBalance, account.currency)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                {renderAccountActions(account)}
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center p-8 text-muted-foreground">
                            You have no archived accounts.
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

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
              This action cannot be undone. This will permanently delete this account. Note: Associated transactions will NOT be deleted automatically.
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

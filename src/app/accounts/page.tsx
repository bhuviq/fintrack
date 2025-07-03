'use client';

import * as React from 'react';
import { MOCK_DATA } from '@/lib/data';
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
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AccountForm, type AccountFormValues } from './account-form';
import { Progress } from '@/components/ui/progress';

type Account = (typeof MOCK_DATA.accounts)[number];

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState<Account[]>(MOCK_DATA.accounts);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [accountToDelete, setAccountToDelete] = React.useState<Account | null>(null);

  const bankAccounts = accounts.filter(acc => acc.type === 'bank');
  const creditCardAccounts = accounts.filter(acc => acc.type === 'credit-card');

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsSheetOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsSheetOpen(true);
  };

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      setAccounts(accounts.filter(acc => acc.id !== accountToDelete.id));
    }
    setDeleteAlertOpen(false);
    setAccountToDelete(null);
  };

  const handleSaveAccount = (data: AccountFormValues) => {
    if (editingAccount && data.id) {
        setAccounts(accounts.map((acc) => acc.id === data.id ? { ...acc, ...data, id: acc.id } as Account : acc));
    } else {
        const newAccount: Account = {
            id: Math.max(0, ...accounts.map((acc) => acc.id)) + 1,
            name: data.name,
            type: data.type,
            balance: data.balance,
            limit: data.limit,
            dueDate: data.dueDate,
        };
        setAccounts([newAccount, ...accounts]);
    }
    setIsSheetOpen(false);
    setEditingAccount(null);
  };

  const formatBalance = (balance: number) => {
    const color = balance >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={color}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  }
  
  const getProgressColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
                 const utilization = account.limit ? (Math.abs(account.balance) / account.limit) * 100 : 0;
                return (
                  <Card key={account.id} className="flex flex-col group relative">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{account.name}</CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
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
                        <p className="text-2xl font-bold">${Math.abs(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-sm text-muted-foreground">of ${account.limit?.toLocaleString()} limit</p>
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
                                <TableCell className="text-right font-medium">{formatBalance(account.balance)}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
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
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this account.
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

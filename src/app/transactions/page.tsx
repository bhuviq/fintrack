
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Edit,
  Calendar as CalendarIcon,
  Briefcase,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionForm, type TransactionFormValues } from './transaction-form';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from '@/services/transactionService';
import { getAccounts } from '@/services/accountService';
import { getCategories } from '@/services/categoryService';
import { getInvestments } from '@/services/investmentService';
import type { Transaction, Account, Category, NewTransaction, Currency, Investment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/context/currency-provider';
import Adsense from '@/components/adsense';

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { currency: globalCurrency } = useCurrency();
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const transactionsAdSlotId = process.env.NEXT_PUBLIC_ADSENSE_TRANSACTIONS_SLOT_ID;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  const [date, setDate] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const fetchAuxiliaryData = useCallback(async () => {
    try {
        const [fetchedAccounts, fetchedCategories, fetchedInvestments] = await Promise.all([
            getAccounts(),
            getCategories(),
            getInvestments(),
        ]);
        setAccounts(fetchedAccounts);
        setCategories(fetchedCategories);
        setInvestments(fetchedInvestments);
    } catch(error: any) {
        console.error("Failed to fetch auxiliary data:", error);
        toast({
            variant: "destructive",
            title: "Network Error",
            description: "Could not connect to the database to fetch accounts/categories.",
        });
    }
  }, [toast]);
  
 const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
        const fetchedTransactions = await getTransactions({
            filters: { date }
        });
        setAllTransactions(fetchedTransactions);
    } catch(error: any) {
        console.error("Failed to fetch transactions:", error);
        toast({
            variant: "destructive",
            title: "Network Error",
            description: error.message || "Could not fetch transactions.",
        });
    } finally {
        setIsLoading(false);
    }
}, [toast, date]);
  
  // Initial auxiliary data fetch
  useEffect(() => {
    if (user) {
      fetchAuxiliaryData();
    }
  }, [user, fetchAuxiliaryData]);

  // Refetch when date range changes
  useEffect(() => {
    if (user) {
        fetchTransactions();
    }
  }, [date, user, fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    let transactions = allTransactions;
    if (typeFilter !== 'all') {
      transactions = transactions.filter(t => t.type === typeFilter);
    }
    if (accountFilter !== 'all') {
      transactions = transactions.filter(t => t.accountId === accountFilter || t.toAccountId === accountFilter);
    }
    if (categoryFilter !== 'all') {
      transactions = transactions.filter(t => t.category === categoryFilter);
    }
    return transactions;
  }, [allTransactions, typeFilter, accountFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, accountFilter, categoryFilter]);
  

  const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
  
  const uniqueCategories = useMemo(() => {
    const categoryNames = new Set(categories.filter(c => c.type === 'expense' || c.type === 'income').map(c => c.name));
    return ['all', ...Array.from(categoryNames)].sort();
  }, [categories]);

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setIsSheetOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    if (transaction.type === 'investment') {
        toast({
            title: "Edit from Investment History",
            description: "Please edit investment transactions directly from the investment's history page.",
        });
        return;
    }
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete) {
        try {
            await deleteTransaction(transactionToDelete.id, transactionToDelete.type, transactionToDelete.investmentId);
            fetchTransactions();
        } catch (error: any) {
            console.error("Failed to delete transaction:", error);
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error.message
            });
        }
    }
    setDeleteAlertOpen(false);
    setTransactionToDelete(null);
  };


  const handleSaveTransaction = async (data: TransactionFormValues) => {
    try {
        const { id, ...transactionData} = data;
        
        if (id && editingTransaction) { 
            await updateTransaction(id, {
                ...transactionData,
                date: format(data.date, 'yyyy-MM-dd'),
                amount: Number(data.amount),
            } as NewTransaction);
        } else {
            await addTransaction({
                ...transactionData,
                date: format(data.date, 'yyyy-MM-dd'),
                amount: Number(data.amount),
            } as NewTransaction);
        }

        fetchTransactions();
    } catch (error: any) {
        console.error("Failed to save transaction:", error);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: error.message
        });
    }
    setIsSheetOpen(false);
    setEditingTransaction(null);
  };

  const formatAmount = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  if (isLoading && allTransactions.length === 0 && currentPage === 1) {
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-60" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                                <TableRow key={`skel-${i}`}>
                                    {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
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
      <div className="flex items-start sm:items-center justify-between mb-6 flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Transactions</h1>
          <p className="text-muted-foreground">
            A complete history of your income and expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddTransaction}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

       <div className="flex flex-wrap items-center gap-2 mb-4">
        <Popover>
            <PopoverTrigger asChild>
                <Button
                id="date"
                variant={"outline"}
                size="sm"
                className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                    date.to ? (
                    <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                    </>
                    ) : (
                    format(date.from, "LLL dd, y")
                    )
                ) : (
                    <span>Filter by date (All)</span>
                )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>

        <Select 
          value={typeFilter} 
          onValueChange={setTypeFilter}
        >
            <SelectTrigger className="w-auto sm:w-[150px] text-sm h-9">
                <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
            </SelectContent>
        </Select>

        <Select 
          value={accountFilter} 
          onValueChange={setAccountFilter}
        >
            <SelectTrigger className="w-auto sm:w-[180px] text-sm h-9">
                <SelectValue placeholder="Filter by account" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>

        <Select 
          value={categoryFilter} 
          onValueChange={setCategoryFilter}
        >
            <SelectTrigger className="w-auto sm:w-[180px] text-sm h-9">
                <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
                 {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category} className="capitalize">{category === 'all' ? 'All Categories' : category}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(ITEMS_PER_PAGE)].map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                      {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
              ))}
              {!isLoading && paginatedTransactions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No transactions found for the selected filters.
                    </TableCell>
                </TableRow>
              )}
              {!isLoading && paginatedTransactions.map((transaction) => {
                const fromAccount = accountMap.get(transaction.accountId);
                const toAccount = transaction.toAccountId ? accountMap.get(transaction.toAccountId) : null;
                const currency = fromAccount ? fromAccount.currency : globalCurrency;

                const getIcon = () => {
                    switch (transaction.type) {
                        case 'income':
                            return (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
                                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                            );
                        case 'expense':
                             return (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900">
                                    <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                            );
                        case 'transfer':
                            return (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
                                    <ArrowLeftRight className="h-4 w-4 text-blue-600 dark:blue-red-400" />
                                </div>
                            );
                        case 'investment':
                            return (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900">
                                    <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            );
                    }
                }

                const getAmountColor = () => {
                     switch (transaction.type) {
                        case 'income': return 'text-green-600';
                        case 'expense': return 'text-red-600';
                        case 'investment': return 'text-red-600';
                        default: return 'text-muted-foreground';
                     }
                }
                
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getIcon()}
                        <span className="font-medium">
                          {transaction.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {transaction.type === 'transfer' 
                            ? `${fromAccount?.name || 'N/A'} → ${toAccount?.name || 'N/A'}` 
                            : fromAccount?.name || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getAmountColor()}`}>
                      {transaction.type === 'income' ? '+' : transaction.type === 'expense' || transaction.type === 'investment' ? '-' : ''}
                      {formatAmount(transaction.amount, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleEditTransaction(transaction)}
                            disabled={transaction.type === 'investment'}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTransaction(transaction)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
            })}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {adsenseClientId && transactionsAdSlotId && (
        <Adsense
            className="mt-6"
            client={adsenseClientId}
            slot={transactionsAdSlotId}
        />
       )}


      <TransactionForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        transaction={editingTransaction}
        onSubmit={handleSaveTransaction}
        accounts={accounts}
        categories={categories}
        investments={investments}
      />
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transaction.
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

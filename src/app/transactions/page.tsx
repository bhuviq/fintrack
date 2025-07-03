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
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Edit,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { TransactionForm, type TransactionFormValues } from './transaction-form';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from '@/services/transactionService';
import { getAccounts } from '@/services/accountService';
import { getCategories } from '@/services/categoryService';
import type { Transaction, Account, Category, NewTransaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [date, setDate] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedTransactions, fetchedAccounts, fetchedCategories] = await Promise.all([
            getTransactions(),
            getAccounts(),
            getCategories(),
        ]);
        setTransactions(fetchedTransactions);
        setAccounts(fetchedAccounts);
        setCategories(fetchedCategories);
    } catch(error: any) {
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, fetchData]);
  
  const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc.name])), [accounts]);

  const filteredTransactions = useMemo(() => {
    let items = [...transactions];
    if (date?.from) {
      const fromDate = new Date(date.from.setHours(0, 0, 0, 0));
      const toDate = date.to ? new Date(date.to.setHours(23, 59, 59, 999)) : fromDate;
      items = items.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= fromDate && transactionDate <= toDate;
      });
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, date]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setIsSheetOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
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
            await deleteTransaction(transactionToDelete.id);
            await fetchData();
        } catch (error) {
            console.error("Failed to delete transaction:", error);
        }
    }
    setDeleteAlertOpen(false);
    setTransactionToDelete(null);
  };


  const handleSaveTransaction = async (data: TransactionFormValues) => {
    try {
        const { id, ...transactionData} = data;
        const newTransaction = {
            ...transactionData,
            date: format(data.date, 'yyyy-MM-dd'),
            amount: Number(data.amount),
        };
        if (editingTransaction && id) {
            await updateTransaction(id, newTransaction);
        } else {
            await addTransaction(newTransaction as NewTransaction);
        }
        await fetchData();
    } catch (error) {
        console.error("Failed to save transaction:", error);
    }
    setIsSheetOpen(false);
    setEditingTransaction(null);
  };
  
  if (isLoading) {
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
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
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
                  <span>Pick a date</span>
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
          <Button onClick={handleAddTransaction}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
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
              {paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 dark:bg-green-900'
                            : 'bg-red-100 dark:bg-red-900'
                        }`}
                      >
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <span className="font-medium">
                        {transaction.description}
                      </span>
                    </div>
                  </TableCell>
                   <TableCell>
                    <Badge variant="secondary">{accountMap.get(transaction.accountId) || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      transaction.type === 'income'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}$
                    {transaction.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
              ))}
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
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        transaction={editingTransaction}
        onSubmit={handleSaveTransaction}
        accounts={accounts}
        categories={categories}
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

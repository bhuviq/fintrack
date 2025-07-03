'use client';

import { useState, useMemo } from 'react';
import { MOCK_DATA } from '@/lib/data';
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

type Transaction = (typeof MOCK_DATA.allTransactions)[0];

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(
    MOCK_DATA.allTransactions
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [date, setDate] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

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

  const confirmDelete = () => {
    if (transactionToDelete) {
      setTransactions(transactions.filter(t => t.id !== transactionToDelete.id));
    }
    setDeleteAlertOpen(false);
    setTransactionToDelete(null);
  };


  const handleSaveTransaction = (data: TransactionFormValues) => {
    if (editingTransaction && data.id) {
      setTransactions(
        transactions.map((t) =>
          t.id === data.id
            ? ({
                ...t,
                ...data,
                date: format(data.date, 'yyyy-MM-dd'),
                amount: Number(data.amount),
              } as Transaction)
            : t
        )
      );
    } else {
      const newTransaction: Transaction = {
        id: Math.max(0, ...transactions.map((t) => t.id)) + 1,
        description: data.description,
        amount: Number(data.amount),
        type: data.type,
        date: format(data.date, 'yyyy-MM-dd'),
        category: data.category,
      };
      setTransactions([newTransaction, ...transactions]);
    }
    setIsSheetOpen(false);
    setEditingTransaction(null);
  };

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

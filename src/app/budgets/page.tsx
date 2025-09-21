
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
import { Calendar as CalendarIcon, MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, differenceInDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { BudgetForm, type BudgetFormValues } from './budget-form';
import { getBudgets, addBudget, updateBudget, deleteBudget } from '@/services/budgetService';
import { getTransactions } from '@/services/transactionService';
import { getCategories } from '@/services/categoryService';
import { getInvestments } from '@/services/investmentService';
import type { Budget, Transaction, Category, NewBudget, Currency, Investment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 6;

export default function BudgetsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [investments, setInvestments] = React.useState<Investment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingBudget, setEditingBudget] = React.useState<Budget | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [budgetToDelete, setBudgetToDelete] = React.useState<Budget | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedBudgets, fetchedTransactions, fetchedCategories, fetchedInvestments] = await Promise.all([
            getBudgets(),
            getTransactions(),
            getCategories(),
            getInvestments(),
        ]);
        setBudgets(fetchedBudgets);
        setTransactions(fetchedTransactions);
        setCategories(fetchedCategories);
        setInvestments(fetchedInvestments);
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


  const handleAddBudget = () => {
    setEditingBudget(null);
    setIsSheetOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsSheetOpen(true);
  };

  const handleDeleteBudget = (budget: Budget) => {
    setBudgetToDelete(budget);
    setDeleteAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (budgetToDelete) {
        try {
            await deleteBudget(budgetToDelete.id);
            await fetchData();
        } catch (error) {
            console.error("Failed to delete budget:", error);
        }
    }
    setDeleteAlertOpen(false);
    setBudgetToDelete(null);
  }

  const handleSaveBudget = async (data: BudgetFormValues) => {
    try {
        const { id, ...budgetData } = data;
        if (editingBudget && id) {
            await updateBudget(id, { ...budgetData, total: Number(budgetData.total) });
        } else {
            await addBudget({ ...budgetData, total: Number(budgetData.total) } as NewBudget);
        }
        await fetchData();
    } catch (error) {
        console.error("Failed to save budget:", error);
    }
    setIsSheetOpen(false);
    setEditingBudget(null);
  };


  const setDateRange = (preset: 'today' | 'yesterday' | 'weekly' | 'monthly') => {
    const today = new Date();
    switch (preset) {
      case 'today':
        setDate({ from: today, to: today });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDate({ from: yesterday, to: yesterday });
        break;
      case 'weekly':
        setDate({ from: startOfWeek(today), to: endOfWeek(today) });
        break;
      case 'monthly':
        setDate({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
    }
  };

  const getProgressColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatAmount = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const calculatedBudgets = React.useMemo(() => {
    if (!date?.from) return [];
  
    const fromDate = date.from;
    const toDate = date.to || fromDate;
  
    // Normalize to start and end of day to include full days
    const start = new Date(fromDate.setHours(0, 0, 0, 0));
    const end = new Date(toDate.setHours(23, 59, 59, 999));
  
    const durationInDays = differenceInDays(end, start) + 1;
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    
    const investmentMap = new Map(investments.map(inv => [inv.id, inv]));
    const categoryTypeMap = new Map(categories.map(cat => [cat.name, cat.type]));
  
    return budgets.map(budget => {
      const proratedTotal = (budget.total / daysInMonth) * durationInDays;
      const budgetCategoryType = categoryTypeMap.get(budget.category);
  
      const spent = transactions.reduce((acc, t) => {
        const transactionDate = new Date(t.date);
        if (transactionDate < start || transactionDate > end) {
          return acc;
        }
  
        if (budgetCategoryType === 'expense' && t.type === 'expense' && t.category === budget.category) {
          return acc + t.amount;
        }
  
        if (budgetCategoryType === 'investment' && t.type === 'investment' && t.investmentId) {
          const investment = investmentMap.get(t.investmentId);
          if (investment && investment.category === budget.category) {
            return acc + t.amount;
          }
        }
  
        return acc;
      }, 0);
  
      return {
        ...budget,
        spent,
        total: proratedTotal,
      };
    });
  }, [date, budgets, transactions, investments, categories]);

  const totalPages = Math.ceil(calculatedBudgets.length / ITEMS_PER_PAGE);
  const paginatedBudgets = calculatedBudgets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-6 w-48" />
                <div className="flex flex-wrap items-center gap-2 pt-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-24" />)}
                </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
            </CardContent>
        </Card>
    )
  }


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budgets</CardTitle>
              <CardDescription>Track your spending against your budgets for different periods.</CardDescription>
            </div>
            <Button onClick={handleAddBudget} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDateRange('today')}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => setDateRange('yesterday')}>Yesterday</Button>
            <Button variant="outline" size="sm" onClick={() => setDateRange('weekly')}>This Week</Button>
            <Button variant="outline" size="sm" onClick={() => setDateRange('monthly')}>This Month</Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  size="sm"
                  className={cn(
                    "w-auto justify-start text-left font-normal",
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
              <PopoverContent className="w-auto p-0" align="start">
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
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedBudgets.map((budget) => {
            const percentage = budget.total > 0 ? (budget.spent / budget.total) * 100 : 0;
            const remaining = budget.total - budget.spent;

            return (
              <div key={budget.id} className="flex flex-col gap-2 p-4 border rounded-lg relative">
                 <div className="absolute top-2 right-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditBudget(budget)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteBudget(budget)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-lg pr-10">{budget.category}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatAmount(budget.spent, budget.currency)} / {formatAmount(budget.total, budget.currency)}
                  </span>
                </div>
                <Progress value={percentage} indicatorClassName={getProgressColor(percentage)} />
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-muted-foreground">{percentage.toFixed(0)}% spent</span>
                  <span className={`${remaining >= 0 ? 'text-green-600' : 'text-destructive'} font-medium`}>
                    {formatAmount(Math.abs(remaining), budget.currency)} {remaining >=0 ? 'left' : 'over'}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between p-4 border-t">
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
            </CardFooter>
          )}
      </Card>
       <BudgetForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        budget={editingBudget}
        onSubmit={handleSaveBudget}
        existingCategories={budgets.map(b => b.category)}
        allCategories={categories}
      />
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this budget.
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

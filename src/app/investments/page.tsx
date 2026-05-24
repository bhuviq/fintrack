
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, ArrowDown, ChevronsUpDown, MoreHorizontal, PlusCircle, Edit, Trash2, History } from 'lucide-react';
import { InvestmentForm, type InvestmentFormValues } from './investment-form';
import { InvestmentHistorySheet } from './investment-history-sheet';
import { InvestmentTransactionForm, type InvestmentTransactionFormValues } from './investment-transaction-form';
import { format } from 'date-fns';
import { getInvestments, getPaginatedInvestments, addInvestment, updateInvestment, deleteInvestment, addInvestmentTransaction, updateInvestmentTransaction, deleteInvestmentTransaction } from '@/services/investmentService';
import { getCategories } from '@/services/categoryService';
import type { Investment, InvestmentTransaction, Category, NewInvestment, Currency } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';

type SortableKeys = keyof Investment | 'quantity' | 'netValue' | 'totalProfit' | 'totalReturn' | 'averageBuyPrice';

export default function InvestmentsPage() {
  const [serverFetchedInvestments, setServerFetchedInvestments] = useState<Investment[]>([]);
  const [allInvestments, setAllInvestments] = useState<Investment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  const [historyInvestment, setHistoryInvestment] = useState<Investment | null>(null);
  const [isTransactionSheetOpen, setIsTransactionSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<{ transaction: InvestmentTransaction; index: number } | null>(null);
  const [deleteTransactionAlertOpen, setDeleteTransactionAlertOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  
  // Filters and pagination
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [totalInvestmentsCount, setTotalInvestmentsCount] = useState(0);

  const fetchAuxiliaryData = useCallback(async () => {
    try {
        const [fetchedCategories, fetchedAllInvestments] = await Promise.all([
            getCategories(),
            getInvestments()
        ]);
        setCategories(fetchedCategories);
        setAllInvestments(fetchedAllInvestments);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch categories.",
        });
    }
  }, [toast]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const { investments, totalCount } = await getPaginatedInvestments({
            category: activeCategory === 'All' ? undefined : activeCategory,
            page: currentPage,
            pageSize,
        });
        setServerFetchedInvestments(investments);
        setTotalInvestmentsCount(totalCount);
    } catch (error: any) {
        console.error("Failed to fetch investment data:", error);
        toast({
            variant: "destructive",
            title: "Network Error",
            description: "Could not connect to the database to fetch investments.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast, activeCategory, currentPage, pageSize]);

  useEffect(() => {
    if(user) {
        fetchAuxiliaryData();
    }
  }, [user, fetchAuxiliaryData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, pageSize]);


  const investmentCategories = useMemo(
    () => categories.filter((c) => c.type === 'investment'),
    [categories]
  );

  const portfolioCategories = useMemo(
    () => ['All', ...investmentCategories.map(c => c.name)],
    [investmentCategories]
  );
  
  const calculateMetrics = useCallback((investments: Investment[]) => {
    return investments.map(investment => {
      const { category, history } = investment;
      if (!history || history.length === 0) {
        return { 
          ...investment, 
          quantity: 0, 
          netValue: 0, 
          totalProfit: 0, 
          totalReturn: 0, 
          averageBuyPrice: 0, 
          investedAmount: 0,
          change: Number(investment.change) || 0,
          changeAmount: Number(investment.changeAmount) || 0
        };
      }

      const quantity = history.reduce((acc, item) => {
        const qty = Number(item.quantity) || 0;
        if (category === 'Real Estate') return acc + (item.type === 'buy' ? 1 : -1);
        return acc + (item.type === 'buy' ? qty : -qty);
      }, 0);

      const netValue = quantity * (Number(investment.value) || 0);

      const buyTransactions = history.filter(item => item.type === 'buy');
      const totalBuyQuantity = buyTransactions.reduce((acc, item) => {
        const qty = category === 'Real Estate' ? 1 : (Number(item.quantity) || 0);
        return acc + qty;
      }, 0);
      const totalBuyCost = buyTransactions.reduce((acc, item) => {
        const qty = category === 'Real Estate' ? 1 : (Number(item.quantity) || 0);
        const price = Number(item.price) || 0;
        const subtotal = qty * price;
        const chargesTotal = (item.charges ?? []).reduce((sum, c) => {
          return sum + (c.type === 'percentage' ? subtotal * c.value / 100 : c.value);
        }, 0);
        return acc + subtotal + chargesTotal;
      }, 0);

      const averageBuyPrice = totalBuyQuantity > 0 ? totalBuyCost / totalBuyQuantity : 0;
      
      const currentPrice = Number(investment.value) || 0;
      const investedAmount = quantity > 0 ? averageBuyPrice * quantity : 0;
      const totalProfit = quantity > 0 ? (currentPrice - averageBuyPrice) * quantity : 0;
      const totalReturn = (averageBuyPrice > 0 && quantity > 0) 
        ? (totalProfit / (averageBuyPrice * quantity)) * 100 
        : (quantity > 0 ? 100 : 0);

      return { 
        ...investment, 
        quantity, 
        netValue, 
        totalProfit, 
        totalReturn, 
        averageBuyPrice, 
        investedAmount,
        change: Number(investment.change) || 0,
        changeAmount: Number(investment.changeAmount) || 0
      };
    });
  }, []);

  const investmentsWithCalculatedFields = useMemo(() => {
    return calculateMetrics(serverFetchedInvestments);
  }, [serverFetchedInvestments, calculateMetrics]);

  const allInvestmentsCalculated = useMemo(() => {
    return calculateMetrics(allInvestments);
  }, [allInvestments, calculateMetrics]);

  const totalSummary = useMemo(() => {
    const summary = allInvestmentsCalculated.reduce((acc, inv) => {
      acc.totalInvested += inv.investedAmount;
      acc.totalValue += inv.netValue;
      acc.totalProfit += inv.totalProfit;
      return acc;
    }, { totalInvested: 0, totalValue: 0, totalProfit: 0 });

    const totalReturn = summary.totalInvested > 0 
      ? (summary.totalProfit / summary.totalInvested) * 100 
      : 0;

    return { ...summary, totalReturn };
  }, [allInvestmentsCalculated]);

  const categorySummary = useMemo(() => {
    if (activeCategory === 'All') return null;

    const filtered = allInvestmentsCalculated.filter(inv => inv.category === activeCategory);
    const summary = filtered.reduce((acc, inv) => {
      acc.totalInvested += inv.investedAmount;
      acc.totalValue += inv.netValue;
      acc.totalProfit += inv.totalProfit;
      return acc;
    }, { totalInvested: 0, totalValue: 0, totalProfit: 0 });

    const totalReturn = summary.totalInvested > 0 
      ? (summary.totalProfit / summary.totalInvested) * 100 
      : 0;

    return { ...summary, totalReturn };
  }, [allInvestmentsCalculated, activeCategory]);
  
  
  const uniqueInvestmentTypes = useMemo(() => {
    const types = new Set(serverFetchedInvestments.map(inv => inv.type).filter(Boolean));
    return ['all', ...Array.from(types)] as string[];
  }, [serverFetchedInvestments]);

  const showTypeFilter = useMemo(() => {
    return serverFetchedInvestments.some(inv => inv.type);
  }, [serverFetchedInvestments]);


  const filteredAndSortedInvestments = useMemo(() => {
    let items = investmentsWithCalculatedFields;
    
    if (searchQuery) {
        items = items.filter(i => 
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.symbol && i.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }
    if (typeFilter !== 'all') {
        items = items.filter(i => i.type === typeFilter);
    }

    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Investment];
        const bValue = b[sortConfig.key as keyof Investment];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue.toLowerCase() < bValue.toLowerCase()) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue.toLowerCase() > bValue.toLowerCase()) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        } else {
           if (Number(aValue) < Number(bValue)) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (Number(aValue) > Number(bValue)) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        }
        return 0;
      });
    }
    return items;
  }, [investmentsWithCalculatedFields, searchQuery, typeFilter, sortConfig]);
  
  const totalPages = Math.ceil(totalInvestmentsCount / pageSize);
  const showSymbolColumn = useMemo(() => filteredAndSortedInvestments.some(i => i.symbol), [filteredAndSortedInvestments]);
  const showTypeColumn = useMemo(() => filteredAndSortedInvestments.some(i => i.type), [filteredAndSortedInvestments]);


  const handleCategoryChange = (value: string) => {
    setActiveCategory(value);
    setTypeFilter('all');
  }
  
  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="h-4 w-4 ml-2" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />;
  };
  
  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatAmount = (amount: number, currency: Currency = 'INR') => {
    const val = Number(amount);
    if (isNaN(val)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleAddInvestment = () => {
    setEditingInvestment(null);
    setIsSheetOpen(true);
  };

  const handleEditInvestment = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsSheetOpen(true);
  };

  const handleDeleteInvestment = (investment: Investment) => {
    setInvestmentToDelete(investment);
    setDeleteAlertOpen(true);
  };

  const handleViewHistory = (investment: Investment) => {
    setHistoryInvestment(investment);
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionSheetOpen(true);
  };

  const handleEditTransactionHistory = (transaction: InvestmentTransaction, index: number) => {
    setEditingTransaction({ transaction, index });
    setIsTransactionSheetOpen(true);
  };

  const handleDeleteTransactionHistory = (index: number) => {
    setTransactionToDelete(index);
    setDeleteTransactionAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (investmentToDelete) {
        try {
            await deleteInvestment(investmentToDelete.id);
            fetchData();
        } catch (error) {
            console.error("Failed to delete investment:", error);
        }
    }
    setDeleteAlertOpen(false);
    setInvestmentToDelete(null);
  }

  const confirmDeleteTransaction = async () => {
    if (transactionToDelete === null || !historyInvestment) return;

    try {
        await deleteInvestmentTransaction(historyInvestment.id, transactionToDelete);
        const updatedData = await getInvestments(); // Fetch all to update history sheet correctly
        setHistoryInvestment(updatedData.find(inv => inv.id === historyInvestment.id) || null);
        fetchData(); // Refetch paginated data for main table
    } catch (error) {
        console.error("Failed to delete transaction:", error);
    }

    setDeleteTransactionAlertOpen(false);
    setTransactionToDelete(null);
  };


  const handleSaveInvestment = async (data: InvestmentFormValues) => {
    try {
        const { id, ...investmentData } = data;
        
        if (editingInvestment && id) {
           await updateInvestment(id, investmentData);
        } else {
            await addInvestment(investmentData as NewInvestment);
        }
        fetchData();
    } catch (error) {
        console.error("Failed to save investment:", error);
        toast({
            variant: "destructive",
            title: "Error Saving Investment",
            description: "There was a problem saving your investment. Please try again.",
        });
    }
    setIsSheetOpen(false);
    setEditingInvestment(null);
  };
  
  const handleSaveInvestmentTransaction = async (data: InvestmentTransactionFormValues, index?: number) => {
    if (!historyInvestment) return;
    try {
        const newTransactionData: Omit<InvestmentTransaction, 'id'> = {
            date: format(data.date, 'yyyy-MM-dd'),
            type: data.type,
            quantity: Number(data.quantity),
            price: Number(data.price),
        };

        if (data.unit) {
            (newTransactionData as InvestmentTransaction).unit = data.unit;
        }

        if (data.charges && data.charges.length > 0) {
            (newTransactionData as InvestmentTransaction).charges = data.charges;
        }

        if (index !== undefined) {
            await updateInvestmentTransaction(historyInvestment.id, index, newTransactionData);
        } else {
            await addInvestmentTransaction(historyInvestment.id, newTransactionData);
        }
        
        const updatedData = await getInvestments(); // Fetch all to update history sheet correctly
        setHistoryInvestment(updatedData.find(inv => inv.id === historyInvestment.id) || null);
        fetchData(); // Refetch paginated data
    } catch (error: any) {
        console.error("Failed to save transaction:", error);
        toast({
            variant: "destructive",
            title: "Error Saving Transaction",
            description: error.message || "There was a problem saving your transaction. Please try again.",
        });
    }

    setIsTransactionSheetOpen(false);
    setEditingTransaction(null);
  };

  const formatQuantity = (investment: Investment) => {
    const { category, history } = investment;

    if (!history || history.length === 0) {
      return '0';
    }

    if (category === 'Real Estate') {
      const quantity = history.reduce((acc, item) => acc + (item.type === 'buy' ? 1 : -1), 0);
      return quantity.toString();
    }

    if (category === 'Gold') {
        const holdings: { [key: string]: number } = {};
        (history as InvestmentTransaction[]).forEach(t => {
            const unit = t.unit || 'oz'; // Default to oz for backward compatibility
            const currentQty = holdings[unit] || 0;
            holdings[unit] = currentQty + (t.type === 'buy' ? t.quantity : -t.quantity);
        });

        const formattedHoldings = Object.entries(holdings)
            .filter(([, qty]) => qty > 0.0001) // Avoid floating point dust
            .map(([unit, qty]) => `${qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${unit}`);

        return formattedHoldings.length > 0 ? formattedHoldings.join(', ') : '0';
    }

    const quantity = history.reduce((acc, item) => {
        return acc + (item.type === 'buy' ? item.quantity : -item.quantity);
    }, 0);

    if (category === 'Mutual Funds') {
        return quantity.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        });
    }
    
    return quantity.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
  };
  
  const renderTableSkeletons = () => (
    [...Array(pageSize)].map((_, i) => (
      <TableRow key={`skel-${i}`}>
        <TableCell className="py-4">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </TableCell>
        <TableCell className="text-right py-4">
          <div className="flex flex-col gap-1 items-end">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </TableCell>
        <TableCell className="text-right py-4">
          <div className="flex flex-col gap-1 items-end">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </TableCell>
        <TableCell className="text-right py-4">
          <div className="flex flex-col gap-1 items-end">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </TableCell>
        <TableCell className="py-4">
          <Skeleton className="h-8 w-8 rounded-md ml-auto" />
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Investment Portfolio</h1>
            <p className="text-muted-foreground">Manage your investment portfolio.</p>
          </div>
          <Button onClick={handleAddInvestment}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Investment
          </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-indigo-100 uppercase tracking-wider">Overall Portfolio</p>
            <div className="mt-2 flex flex-col gap-1">
              <h3 className="text-2xl font-bold">{formatAmount(totalSummary.totalValue)}</h3>
              <p className="text-xs text-indigo-100">Invested: {formatAmount(totalSummary.totalInvested)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${totalSummary.totalProfit >= 0 ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'}`}>
                  {totalSummary.totalProfit >= 0 ? '+' : ''}{formatAmount(totalSummary.totalProfit)} ({totalSummary.totalReturn.toFixed(2)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {categorySummary && (
          <Card className="relative overflow-hidden border-none bg-white dark:bg-zinc-900 shadow-md border-l-4 border-indigo-500">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{activeCategory} Category</p>
              <div className="mt-2 flex flex-col gap-1">
                <h3 className="text-2xl font-bold">{formatAmount(categorySummary.totalValue)}</h3>
                <p className="text-xs text-muted-foreground">Invested: {formatAmount(categorySummary.totalInvested)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${categorySummary.totalProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {categorySummary.totalProfit >= 0 ? '+' : ''}{formatAmount(categorySummary.totalProfit)} ({categorySummary.totalReturn.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={activeCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {portfolioCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by name or symbol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
        {showTypeFilter && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {uniqueInvestmentTypes.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type === 'all' ? 'All Types' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>
                    <div className="flex items-center">Investment {getSortIcon('name')}</div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => requestSort('value')}>
                    <div className="flex items-center justify-end">Market Price {getSortIcon('value')}</div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => requestSort('totalProfit')}>
                    <div className="flex items-center justify-end">Returns (%) {getSortIcon('totalProfit')}</div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => requestSort('netValue')}>
                    <div className="flex items-center justify-end">Current (Invested) {getSortIcon('netValue')}</div>
                </TableHead>
                <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderTableSkeletons() : filteredAndSortedInvestments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">No investments found.</TableCell>
                </TableRow>
              ) : (
                filteredAndSortedInvestments.map((investment) => {
                  const inv = investment as any;
                  const profitColor = inv.totalProfit >= 0 ? 'text-green-600' : 'text-red-600';
                  const changeColor = inv.changeAmount >= 0 ? 'text-green-600' : 'text-red-600';

                  return (
                    <TableRow key={investment.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-base text-foreground leading-tight">{investment.name}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatQuantity(investment)}</span>
                            <span>•</span>
                            <span>Avg. {formatAmount(inv.averageBuyPrice, investment.currency)}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-base">{formatAmount(investment.value, investment.currency)}</span>
                          <div className={`flex items-center justify-end gap-1 text-xs ${changeColor}`}>
                            {inv.changeAmount >= 0 ? '+' : ''}{formatNumber(inv.changeAmount)} ({inv.change.toFixed(2)}%)
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`font-bold text-base ${profitColor}`}>
                            {inv.totalProfit >= 0 ? '+' : ''}{formatAmount(inv.totalProfit, investment.currency)}
                          </span>
                          <div className={`text-xs ${profitColor}`}>
                            {inv.totalReturn.toFixed(2)}%
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-base">{formatAmount(inv.netValue, investment.currency)}</span>
                          <span className="text-xs text-muted-foreground">{formatAmount(inv.investedAmount, investment.currency)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewHistory(investment)}>
                              <History className="mr-2 h-4 w-4" /> View History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditInvestment(investment)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteInvestment(investment)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Page {currentPage} of {totalPages} ({totalInvestmentsCount} items)</span>
                <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <Select 
                        value={String(pageSize)}
                        onValueChange={(value) => setPageSize(Number(value))}
                        >
                        <SelectTrigger className="w-auto sm:w-[120px] h-8">
                            <SelectValue placeholder="Page size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
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
      <InvestmentForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        investment={editingInvestment}
        onSubmit={handleSaveInvestment}
        availableCategories={investmentCategories}
      />
      <InvestmentHistorySheet
        investment={historyInvestment}
        isOpen={!!historyInvestment}
        onOpenChange={(isOpen) => !isOpen && setHistoryInvestment(null)}
        onAddTransaction={handleAddTransaction}
        onEditTransaction={handleEditTransactionHistory}
        onDeleteTransaction={handleDeleteTransactionHistory}
      />
       <InvestmentTransactionForm 
        isOpen={isTransactionSheetOpen}
        onOpenChange={setIsTransactionSheetOpen}
        onSubmit={handleSaveInvestmentTransaction}
        investmentCategory={historyInvestment?.category}
        investmentCurrency={historyInvestment?.currency}
        transaction={editingTransaction?.transaction}
        transactionIndex={editingTransaction?.index}
       />
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this investment.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <AlertDialog open={deleteTransactionAlertOpen} onOpenChange={setDeleteTransactionAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this transaction record.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteTransaction}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

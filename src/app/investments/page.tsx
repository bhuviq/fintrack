
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

type SortableKeys = keyof Investment | 'quantity' | 'netValue';

export default function InvestmentsPage() {
  const [serverFetchedInvestments, setServerFetchedInvestments] = useState<Investment[]>([]);
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
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
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
  
  const investmentsWithCalculatedFields = useMemo(() => {
    return serverFetchedInvestments.map(investment => {
      const { category, history } = investment;
       if (!history || history.length === 0) {
        return { ...investment, quantity: 0, netValue: 0 };
      }
      const quantity = history.reduce((acc, item) => {
        if (category === 'Real Estate') return acc + (item.type === 'buy' ? 1 : -1);
        return acc + (item.type === 'buy' ? item.quantity : -item.quantity);
      }, 0);
      const netValue = quantity * investment.value;
      return { ...investment, quantity, netValue };
    });
  }, [serverFetchedInvestments]);
  
  
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

  const formatAmount = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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

  if(isLoading && serverFetchedInvestments.length === 0) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-10 w-80" />
            </div>
            <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
    )
  }

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

      <div className="flex flex-wrap items-center gap-2">
        <Select value={activeCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
          className="w-full sm:w-auto sm:flex-1"
        />
        {showTypeFilter && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
              <TableRow>
                <TableHead onClick={() => requestSort('name')} className="cursor-pointer">
                    <div className="flex items-center">Name {getSortIcon('name')}</div>
                </TableHead>
                {activeCategory === 'All' && <TableHead onClick={() => requestSort('category')} className="cursor-pointer">
                    <div className="flex items-center">Category {getSortIcon('category')}</div>
                </TableHead>}
                {showSymbolColumn && <TableHead className="cursor-pointer" onClick={() => requestSort('symbol')}><div className="flex items-center">Symbol {getSortIcon('symbol')}</div></TableHead>}
                {showTypeColumn && <TableHead className="cursor-pointer" onClick={() => requestSort('type')}><div className="flex items-center">Type {getSortIcon('type')}</div></TableHead>}
                <TableHead className="text-right cursor-pointer" onClick={() => requestSort('quantity')}>
                    <div className="flex items-center justify-end">Quantity {getSortIcon('quantity')}</div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => requestSort('value')}>
                    <div className="flex items-center justify-end">Price {getSortIcon('value')}</div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => requestSort('netValue')}>
                    <div className="flex items-center justify-end">Value {getSortIcon('netValue')}</div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => requestSort('change')}>
                    <div className="flex items-center justify-end">Today's Change {getSortIcon('change')}</div>
                </TableHead>
                <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedInvestments.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">{investment.name}</TableCell>
                  {activeCategory === 'All' && <TableCell><Badge variant="outline">{investment.category}</Badge></TableCell>}
                  {showSymbolColumn && <TableCell className="text-muted-foreground">{investment.symbol || 'N/A'}</TableCell>}
                  {showTypeColumn && <TableCell className="text-muted-foreground">{investment.type || 'N/A'}</TableCell>}
                  <TableCell className="text-right font-medium">{formatQuantity(investment)}</TableCell>
                  <TableCell className="text-right font-medium">{formatAmount(investment.value, investment.currency)}</TableCell>
                  <TableCell className="text-right font-medium">{formatAmount(investment.netValue, investment.currency)}</TableCell>
                  <TableCell className={`text-right font-medium ${investment.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="flex items-center justify-end">
                      {investment.change >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                      <span>{investment.change.toFixed(2)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleViewHistory(investment)}>
                                  <History className="mr-2 h-4 w-4" />
                                  View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditInvestment(investment)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteInvestment(investment)}>
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
        {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({totalInvestmentsCount} items)
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

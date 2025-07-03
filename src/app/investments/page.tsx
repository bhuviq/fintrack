'use client';

import { useState, useMemo } from 'react';
import { MOCK_DATA } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowUp, ArrowDown, MoreHorizontal, PlusCircle, Edit, Trash2, History } from 'lucide-react';
import { InvestmentForm, type InvestmentFormValues } from './investment-form';
import { InvestmentHistorySheet } from './investment-history-sheet';
import { InvestmentTransactionForm, type InvestmentTransactionFormValues } from './investment-transaction-form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

type Investment = (typeof MOCK_DATA.investments)[0];

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>(MOCK_DATA.investments);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [historyInvestment, setHistoryInvestment] = useState<Investment | null>(null);
  const [isTransactionSheetOpen, setIsTransactionSheetOpen] = useState(false);

  const investmentCategories = useMemo(
    () => MOCK_DATA.categories.filter((c) => c.type === 'investment'),
    []
  );

  const portfolioCategories = useMemo(
    () => ['All', ...Array.from(new Set(investments.map((i) => i.category)))],
    [investments]
  );

  const filteredInvestments = useMemo(() => {
    if (activeTab === 'All') {
      return investments;
    }
    return investments.filter((i) => i.category === activeTab);
  }, [investments, activeTab]);

  const totalValue = filteredInvestments.reduce((acc, investment) => acc + investment.value, 0);
  const totalChange = filteredInvestments.reduce((acc, investment) => acc + investment.changeAmount, 0);

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
    setIsTransactionSheetOpen(true);
  };

  const confirmDelete = () => {
    if (investmentToDelete) {
        setInvestments(investments.filter(i => i.id !== investmentToDelete.id));
    }
    setDeleteAlertOpen(false);
    setInvestmentToDelete(null);
  }

  const handleSaveInvestment = (data: InvestmentFormValues) => {
    if (editingInvestment && data.id) {
      const originalInvestment = investments.find((i) => i.id === data.id);
      if (!originalInvestment) return;

      const newValue = Number(data.value);
      // "Start of day" value is the current value minus today's change.
      const startOfDayValue =
        originalInvestment.value - originalInvestment.changeAmount;

      const newChangeAmount = newValue - startOfDayValue;
      const newChangePercentage =
        startOfDayValue !== 0 ? (newChangeAmount / startOfDayValue) * 100 : 0;

      setInvestments(
        investments.map((i) =>
          i.id === data.id
            ? {
                ...i,
                name: data.name,
                category: data.category,
                symbol: data.symbol || '',
                value: newValue,
                change: newChangePercentage,
                changeAmount: newChangeAmount,
              }
            : i
        )
      );
    } else {
      const newInvestment: Investment = {
        id: Math.max(0, ...investments.map((i) => i.id)) + 1,
        name: data.name,
        category: data.category,
        symbol: data.symbol || '',
        value: Number(data.value),
        change: 0,
        changeAmount: 0,
        history: [], // New investments start with empty history
      };
      setInvestments([newInvestment, ...investments]);
    }
    setIsSheetOpen(false);
    setEditingInvestment(null);
  };
  
  const handleSaveInvestmentTransaction = (data: InvestmentTransactionFormValues) => {
    if (!historyInvestment) return;

    const newTransaction = {
      date: format(data.date, 'yyyy-MM-dd'),
      type: data.type,
      quantity: Number(data.quantity),
      price: Number(data.price),
    };

    const updatedInvestments = investments.map(inv => {
        if (inv.id === historyInvestment.id) {
            return {
                ...inv,
                history: [...inv.history, newTransaction],
            };
        }
        return inv;
    });
    setInvestments(updatedInvestments);

    const newlyUpdatedInvestment = updatedInvestments.find(inv => inv.id === historyInvestment.id);
    setHistoryInvestment(newlyUpdatedInvestment || null);

    setIsTransactionSheetOpen(false);
  };

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

      <Tabs defaultValue="All" onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          {portfolioCategories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
          <CardDescription>
            An overview of your investment performance for {activeTab === 'All' ? 'all categories' : activeTab}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
              <p className="text-3xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Change</p>
              <div className={`flex items-center text-3xl font-bold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalChange >= 0 ? <ArrowUp className="h-7 w-7" /> : <ArrowDown className="h-7 w-7" />}
                ${Math.abs(totalChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Today's Change</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvestments.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">{investment.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{investment.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{investment.symbol || 'N/A'}</TableCell>
                  <TableCell className="text-right font-medium">${investment.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
      />
       <InvestmentTransactionForm 
        isOpen={isTransactionSheetOpen}
        onOpenChange={setIsTransactionSheetOpen}
        onSubmit={handleSaveInvestmentTransaction}
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
    </div>
  );
}

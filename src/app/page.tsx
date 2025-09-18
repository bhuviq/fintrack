
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  DollarSign,
  Banknote,
  Landmark,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { getTransactions } from '@/services/transactionService';
import { getGoals } from '@/services/goalService';
import { getInvestments } from '@/services/investmentService';
import { getAccounts } from '@/services/accountService';
import type { Transaction, Goal, Investment, Account } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/context/currency-provider';
import Adsense from '@/components/adsense';

export default function DashboardPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [investments, setInvestments] = React.useState<Investment[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const accountMap = React.useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const dashboardAdSlotId = process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT_ID;


  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        fetchedTransactions,
        fetchedGoals,
        fetchedInvestments,
        fetchedAccounts,
      ] = await Promise.all([
        getTransactions(),
        getGoals(),
        getInvestments(),
        getAccounts(),
      ]);
      setTransactions(fetchedTransactions);
      setGoals(fetchedGoals);
      setInvestments(fetchedInvestments);
      setAccounts(fetchedAccounts);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
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

  const summary = React.useMemo(() => {
    const totalInvestments = investments.reduce((acc, inv) => {
      const totalQuantity = (inv.history || []).reduce((quantity, tx) => {
        if (inv.category === 'Real Estate') {
          return quantity + (tx.type === 'buy' ? 1 : -1);
        }
        return quantity + (tx.type === 'buy' ? tx.quantity : -tx.quantity);
      }, 0);
      return acc + inv.value * totalQuantity;
    }, 0);

    const accountBalances = accounts.map((account) => {
      const balanceDate = new Date(account.balanceDate);
      const transactionTotal = transactions.reduce((total, t) => {
          const transactionDate = new Date(t.date);
          if (transactionDate < balanceDate) {
              return total;
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
      return { ...account, currentBalance: account.openingBalance + transactionTotal };
    });
    
    const cashAndBrokerage = accountBalances
      .filter((acc) => acc.type === 'bank' || acc.type === 'broker')
      .reduce((acc, b) => acc + b.currentBalance, 0);

    const creditCardDebt = accountBalances
      .filter((acc) => acc.type === 'credit-card')
      .reduce((acc, cc) => acc + cc.currentBalance, 0);

    const netWorth = totalInvestments + cashAndBrokerage + creditCardDebt;

    return {
      netWorth,
      cashAndBrokerage: cashAndBrokerage,
      investments: totalInvestments,
      creditCardDebt,
    };
  }, [investments, accounts, transactions]);

  const spending = React.useMemo(() => {
    const spendingByCategory: { [key: string]: number } = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        spendingByCategory[t.category] =
          (spendingByCategory[t.category] || 0) + t.amount;
      });
    return Object.entries(spendingByCategory)
      .map(([name, value]) => ({ name, value }))
      .slice(0, 6);
  }, [transactions]);
  
  const recentTransactions = React.useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);


  const summaryCards = [
    {
      title: 'Net Worth',
      amount: summary.netWorth,
      icon: <DollarSign className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: 'Cash & Brokerage',
      amount: summary.cashAndBrokerage,
      icon: <Landmark className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: 'Investments',
      amount: summary.investments,
      icon: <Banknote className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: 'Credit Card Debt',
      amount: Math.abs(summary.creditCardDebt),
      icon: <CreditCard className="h-6 w-6 text-muted-foreground" />,
    },
  ];

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[150px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
             <div className="grid gap-6 lg:grid-cols-2">
                <Card><CardHeader><CardTitle>Spending Overview</CardTitle></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
                <Card><CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            </div>
             <Card><CardHeader><CardTitle>Financial Goals</CardTitle></CardHeader><CardContent><Skeleton className="h-[100px] w-full" /></CardContent></Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(card.amount)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
            <CardDescription>
              Your spending by category for the current month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spending}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value as number).replace(/\.00$/, '')}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                  }}
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your 5 most recent transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => {
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
                                        <ArrowLeftRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                            <TableCell>
                            <div className="flex items-center gap-3">
                                {getIcon()}
                                <div>
                                <div className="font-medium">
                                    {transaction.description}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {transaction.category}
                                </div>
                                </div>
                            </div>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${getAmountColor()}`}>
                                {transaction.type === 'income' ? '+' : transaction.type === 'expense' || transaction.type === 'investment' ? '-' : ''}
                                {formatCurrency(transaction.amount)}
                            </TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Goals</CardTitle>
          <CardDescription>
            Track your progress towards your financial goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <div key={goal.id} className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="font-medium">{goal.name}</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                </span>
              </div>
              <Progress value={(goal.current / goal.target) * 100} />
            </div>
          ))}
        </CardContent>
      </Card>

      {adsenseClientId && dashboardAdSlotId && (
        <Adsense
            className="mt-6"
            client={adsenseClientId}
            slot={dashboardAdSlotId}
        />
       )}
    </div>
  );
}

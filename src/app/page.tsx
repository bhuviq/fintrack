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
  DollarSign,
  Banknote,
  Landmark,
  CreditCard,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { MOCK_DATA } from '@/lib/data';

export default function DashboardPage() {
  const { recentTransactions, spending, goals, investments, accounts, allTransactions } = MOCK_DATA;

  const summary = React.useMemo(() => {
    const totalInvestments = investments.reduce((acc, inv) => acc + inv.value, 0);

    const accountBalances = accounts.map(account => {
        const relevantTransactions = allTransactions.filter(t => t.accountId === account.id);
        const transactionTotal = relevantTransactions.reduce((total, t) => {
            if (account.type === 'bank') {
                return t.type === 'income' ? total + t.amount : total - t.amount;
            }
            if (account.type === 'credit-card') {
                return t.type === 'expense' ? total - t.amount : total + t.amount;
            }
            return total;
        }, 0);
        return { ...account, currentBalance: account.balance + transactionTotal };
    });

    const bankAccountsBalance = accountBalances
      .filter(acc => acc.type === 'bank')
      .reduce((acc, b) => acc + b.currentBalance, 0);
      
    const creditCardDebt = accountBalances
      .filter(acc => acc.type === 'credit-card')
      .reduce((acc, cc) => acc + cc.currentBalance, 0);

    const netWorth = totalInvestments + bankAccountsBalance + creditCardDebt;

    return {
        netWorth,
        bankAccounts: bankAccountsBalance,
        investments: totalInvestments,
        creditCardDebt,
    }
  }, [investments, accounts, allTransactions]);

  const summaryCards = [
    {
      title: 'Net Worth',
      amount: summary.netWorth,
      icon: <DollarSign className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: 'Bank Accounts',
      amount: summary.bankAccounts,
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${card.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
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
                    <TableCell
                      className={`text-right font-medium ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}$
                      {transaction.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
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
                  ${goal.current.toLocaleString()} / $
                  {goal.target.toLocaleString()}
                </span>
              </div>
              <Progress value={(goal.current / goal.target) * 100} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import * as React from 'react';
import { MOCK_DATA } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, differenceInDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

export default function BudgetsPage() {
  const { budgets: monthlyBudgets, allTransactions } = MOCK_DATA;
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

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

  const calculatedBudgets = React.useMemo(() => {
    if (!date?.from) return [];

    const fromDate = date.from;
    const toDate = date.to || fromDate;
    
    // Normalize to start and end of day to include full days
    const start = new Date(fromDate.setHours(0, 0, 0, 0));
    const end = new Date(toDate.setHours(23, 59, 59, 999));
    
    const durationInDays = differenceInDays(end, start) + 1;
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

    return monthlyBudgets.map(budget => {
      const proratedTotal = (budget.total / daysInMonth) * durationInDays;

      const spent = allTransactions
        .filter(t => 
            t.category === budget.category && 
            t.type === 'expense' &&
            new Date(t.date) >= start &&
            new Date(t.date) <= end
        )
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        ...budget,
        spent,
        total: proratedTotal,
      };
    });
  }, [date, monthlyBudgets, allTransactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>Track your spending against your budgets for different periods.</CardDescription>
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
        {calculatedBudgets.map((budget) => {
          const percentage = budget.total > 0 ? (budget.spent / budget.total) * 100 : 0;
          const remaining = budget.total - budget.spent;

          return (
            <div key={budget.id} className="flex flex-col gap-2 p-4 border rounded-lg">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-lg">{budget.category}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  ${budget.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${budget.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <Progress value={percentage} indicatorClassName={getProgressColor(percentage)} />
              <div className="flex justify-between items-baseline text-sm">
                <span className="text-muted-foreground">{percentage.toFixed(0)}% spent</span>
                <span className={`${remaining >= 0 ? 'text-green-600' : 'text-destructive'} font-medium`}>
                  ${Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {remaining >=0 ? 'left' : 'over'}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

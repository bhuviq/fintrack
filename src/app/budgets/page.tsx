import { MOCK_DATA } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function BudgetsPage() {
  const { budgets } = MOCK_DATA;

  const getProgressColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>Track your spending against your monthly budgets.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.total) * 100;
          const remaining = budget.total - budget.spent;

          return (
            <div key={budget.id} className="flex flex-col gap-2 p-4 border rounded-lg">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-lg">{budget.category}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  ${budget.spent.toLocaleString()} / ${budget.total.toLocaleString()}
                </span>
              </div>
              <Progress value={percentage} indicatorClassName={getProgressColor(percentage)} />
              <div className="flex justify-between items-baseline text-sm">
                <span className="text-muted-foreground">{percentage.toFixed(0)}% spent</span>
                <span className={`${remaining >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                  ${Math.abs(remaining).toLocaleString()} {remaining >=0 ? 'left' : 'over'}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

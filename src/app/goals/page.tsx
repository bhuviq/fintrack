import Image from 'next/image';
import { MOCK_DATA } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function GoalsPage() {
  const { goals } = MOCK_DATA;
  const goalImages = [
    'https://placehold.co/600x400.png',
    'https://placehold.co/600x400.png',
    'https://placehold.co/600x400.png',
  ];
  const goalHints = ['vacation japan', 'new car', 'emergency savings'];


  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal, index) => {
        const percentage = (goal.current / goal.target) * 100;

        return (
          <Card key={goal.id} className="flex flex-col">
            <CardHeader className="p-0">
              <Image
                src={goalImages[index]}
                alt={goal.name}
                width={600}
                height={400}
                className="rounded-t-lg object-cover aspect-[3/2]"
                data-ai-hint={goalHints[index]}
              />
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <CardTitle className="mb-2">{goal.name}</CardTitle>
              <p className="text-2xl font-bold text-primary">
                ${goal.current.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                saved of ${goal.target.toLocaleString()}
              </p>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <div className="w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{percentage.toFixed(0)}%</span>
                </div>
                <Progress value={percentage} />
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

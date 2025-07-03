'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { MOCK_DATA } from '@/lib/data';

type Goal = (typeof MOCK_DATA.goals)[number];

interface GoalHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  goal: Goal | null;
  onDeleteContribution: (goalId: number, contributionId: number) => void;
}

export function GoalHistorySheet({
  isOpen,
  onOpenChange,
  goal,
  onDeleteContribution,
}: GoalHistorySheetProps) {
  if (!goal) {
    return null;
  }
  
  const history = goal.history || [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>History for {goal.name}</SheetTitle>
          <SheetDescription>View all contributions made to this goal.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          {history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history
                    .slice() // Create a shallow copy to avoid mutating the original array
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(item.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDeleteContribution(goal.id, item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg mt-4">
                <p className="text-muted-foreground">No contributions yet.</p>
                <p className="text-sm text-muted-foreground">Add funds to start tracking your progress!</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

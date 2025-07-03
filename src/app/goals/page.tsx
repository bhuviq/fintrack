
'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Edit, Trash2, History, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { GoalForm, type GoalFormValues } from './goal-form';
import { GoalContributionForm, type ContributionFormValues } from './goal-contribution-form';
import { GoalHistorySheet } from './goal-history-sheet';
import { getGoals, addGoal, updateGoal, deleteGoal, addContribution, deleteContribution } from '@/services/goalService';
import type { Goal, NewGoal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/context/currency-provider';


export default function GoalsPage() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const [isGoalFormOpen, setIsGoalFormOpen] = React.useState(false);
  const [isContributionFormOpen, setIsContributionFormOpen] = React.useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<Goal | null>(null);
  const [deleteGoalAlertOpen, setDeleteGoalAlertOpen] = React.useState(false);
  const [deleteContributionAlertOpen, setDeleteContributionAlertOpen] = React.useState(false);
  const [contributionToDelete, setContributionToDelete] = React.useState<{ goalId: string; contributionId: string } | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const fetchedGoals = await getGoals();
        setGoals(fetchedGoals);
    } catch (error: any) {
        console.error("Failed to fetch goals:", error);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, fetchData]);

  // This effect ensures that if the 'selectedGoal' is being displayed in a sheet,
  // it always has the most up-to-date data from the main 'goals' list.
  React.useEffect(() => {
    if (selectedGoal) {
      const updatedGoalData = goals.find(g => g.id === selectedGoal.id);
      if (updatedGoalData) {
        // Only update state if the data has actually changed to prevent loops.
        setSelectedGoal(currentSelectedGoal => {
          if (JSON.stringify(currentSelectedGoal) !== JSON.stringify(updatedGoalData)) {
            return updatedGoalData;
          }
          return currentSelectedGoal;
        });
      } else {
        // Goal was deleted, so clear selection
        setSelectedGoal(null);
      }
    }
  }, [goals, selectedGoal]);


  const handleAddGoal = () => {
    setSelectedGoal(null);
    setIsGoalFormOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsGoalFormOpen(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setDeleteGoalAlertOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (selectedGoal) {
      try {
        await deleteGoal(selectedGoal.id);
        await fetchData();
      } catch (error) {
        console.error("Failed to delete goal:", error);
      }
    }
    setDeleteGoalAlertOpen(false);
    setSelectedGoal(null);
  };

  const handleSaveGoal = async (data: GoalFormValues) => {
    try {
        const { id, ...goalData } = data;
        if (selectedGoal && id) {
            await updateGoal(id, { name: goalData.name, target: goalData.target });
        } else {
            await addGoal(goalData as NewGoal);
        }
        await fetchData();
    } catch (error) {
        console.error("Failed to save goal:", error);
    }
    setIsGoalFormOpen(false);
    setSelectedGoal(null);
  };

  const handleAddContribution = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsContributionFormOpen(true);
  };

  const handleSaveContribution = async (data: ContributionFormValues) => {
    if (!selectedGoal) return;
    try {
        await addContribution(selectedGoal.id, {
            date: format(data.date, 'yyyy-MM-dd'),
            amount: data.amount,
        });
        await fetchData();
    } catch (error) {
        console.error("Failed to save contribution:", error);
    }
    setIsContributionFormOpen(false);
    setSelectedGoal(null);
  };

  const handleViewHistory = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsHistorySheetOpen(true);
  };

  const handleDeleteContribution = (goalId: string, contributionId: string) => {
    setContributionToDelete({ goalId, contributionId });
    setDeleteContributionAlertOpen(true);
  };

  const confirmDeleteContribution = async () => {
    if (!contributionToDelete) return;
    try {
        await deleteContribution(contributionToDelete.goalId, contributionToDelete.contributionId);
        await fetchData();
    } catch (error) {
        console.error("Failed to delete contribution:", error);
    }
    setDeleteContributionAlertOpen(false);
    setContributionToDelete(null);
  };
  
  if (isLoading) {
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {[...Array(3)].map((_, i) => <Card key={i} className="h-48"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-full w-full" /></CardContent></Card>)}
            </div>
        </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Financial Goals</h1>
          <p className="text-muted-foreground">Set and track your financial goals.</p>
        </div>
        <Button onClick={handleAddGoal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const currentAmount = goal.current || 0;
          const percentage = goal.target > 0 ? (currentAmount / goal.target) * 100 : 0;

          return (
            <Card key={goal.id} className="flex flex-col relative">
               <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleAddContribution(goal)}>
                              <Landmark className="mr-2 h-4 w-4" />
                              Add Funds
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleViewHistory(goal)}>
                              <History className="mr-2 h-4 w-4" />
                              View History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteGoal(goal)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
              <CardContent className="flex-1 p-6">
                <CardTitle className="mb-2 pr-10">{goal.name}</CardTitle>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(currentAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  saved of {formatCurrency(goal.target)}
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

      <GoalForm
        isOpen={isGoalFormOpen}
        onOpenChange={setIsGoalFormOpen}
        onSubmit={handleSaveGoal}
        goal={selectedGoal}
      />
      
      <GoalContributionForm
        isOpen={isContributionFormOpen}
        onOpenChange={setIsContributionFormOpen}
        onSubmit={handleSaveContribution}
        goalName={selectedGoal?.name}
      />

      <GoalHistorySheet
        isOpen={isHistorySheetOpen}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setSelectedGoal(null);
            }
            setIsHistorySheetOpen(isOpen)
        }}
        goal={selectedGoal}
        onDeleteContribution={handleDeleteContribution}
      />

      <AlertDialog open={deleteGoalAlertOpen} onOpenChange={setDeleteGoalAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete this goal and its contribution history.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedGoal(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteGoal}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteContributionAlertOpen} onOpenChange={setDeleteContributionAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete this contribution record.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setContributionToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteContribution}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

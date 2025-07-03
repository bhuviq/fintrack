'use client';

import * as React from 'react';
import { MOCK_DATA } from '@/lib/data';
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

type Goal = (typeof MOCK_DATA.goals)[0];
type GoalHistoryItem = Goal['history'][0];

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<Goal[]>(MOCK_DATA.goals);
  const [isGoalFormOpen, setIsGoalFormOpen] = React.useState(false);
  const [isContributionFormOpen, setIsContributionFormOpen] = React.useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<Goal | null>(null);
  const [deleteGoalAlertOpen, setDeleteGoalAlertOpen] = React.useState(false);
  const [deleteContributionAlertOpen, setDeleteContributionAlertOpen] = React.useState(false);
  const [contributionToDelete, setContributionToDelete] = React.useState<{ goalId: number; contributionId: number } | null>(null);

  // This effect ensures that if the 'selectedGoal' is being displayed in a sheet,
  // it always has the most up-to-date data from the main 'goals' list.
  React.useEffect(() => {
    if (selectedGoal) {
      const updatedGoalData = goals.find(g => g.id === selectedGoal.id);
      setSelectedGoal(updatedGoalData || null);
    }
  }, [goals, selectedGoal?.id]);


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

  const confirmDeleteGoal = () => {
    if (selectedGoal) {
      setGoals(currentGoals => currentGoals.filter(g => g.id !== selectedGoal.id));
    }
    setDeleteGoalAlertOpen(false);
    setSelectedGoal(null);
  };

  const handleSaveGoal = (data: GoalFormValues) => {
    if (selectedGoal && data.id) {
      setGoals(currentGoals => currentGoals.map(g => g.id === data.id ? { ...g, name: data.name, target: data.target } : g));
    } else {
      const newGoal: Goal = {
        id: Math.max(0, ...goals.map(g => g.id)) + 1,
        name: data.name,
        target: data.target,
        current: 0,
        history: [],
      };
      setGoals(currentGoals => [newGoal, ...currentGoals]);
    }
    setIsGoalFormOpen(false);
    setSelectedGoal(null);
  };

  const handleAddContribution = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsContributionFormOpen(true);
  };

  const handleSaveContribution = (data: ContributionFormValues) => {
    if (!selectedGoal) return;

    const newContribution = {
      id: Math.max(0, ...(selectedGoal.history || []).map(h => h.id)) + 1,
      date: format(data.date, 'yyyy-MM-dd'),
      amount: data.amount,
    };

    setGoals(currentGoals => currentGoals.map(g => {
      if (g.id === selectedGoal.id) {
        const updatedHistory = [...(g.history || []), newContribution];
        const updatedCurrent = updatedHistory.reduce((acc, item) => acc + item.amount, 0);
        return { ...g, history: updatedHistory, current: updatedCurrent };
      }
      return g;
    }));

    setIsContributionFormOpen(false);
    setSelectedGoal(null);
  };

  const handleViewHistory = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsHistorySheetOpen(true);
  };

  const handleDeleteContribution = (goalId: number, contributionId: number) => {
    setContributionToDelete({ goalId, contributionId });
    setDeleteContributionAlertOpen(true);
  };

  const confirmDeleteContribution = () => {
    if (!contributionToDelete) return;

    setGoals(currentGoals => currentGoals.map(g => {
      if (g.id === contributionToDelete.goalId) {
        const updatedHistory = (g.history || []).filter(h => h.id !== contributionToDelete.contributionId);
        const updatedCurrent = updatedHistory.reduce((acc, item) => acc + item.amount, 0);
        return { ...g, history: updatedHistory, current: updatedCurrent };
      }
      return g;
    }));
    
    setDeleteContributionAlertOpen(false);
    setContributionToDelete(null);
  };

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
          const currentAmount = (goal.history || []).reduce((acc, item) => acc + item.amount, 0);
          const percentage = goal.target > 0 ? (currentAmount / goal.target) * 100 : 0;

          return (
            <Card key={goal.id} className="flex flex-col group relative">
               <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
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
                <CardTitle className="mb-2">{goal.name}</CardTitle>
                <p className="text-2xl font-bold text-primary">
                  ${currentAmount.toLocaleString()}
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

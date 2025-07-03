'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import type { Goal } from '@/lib/types';


const goalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Goal name must be at least 3 characters.' }),
  target: z.coerce.number().positive({ message: 'Target must be a positive number.' }),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

interface GoalFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  goal?: Goal | null;
  onSubmit: (data: GoalFormValues) => void;
}

export function GoalForm({ isOpen, onOpenChange, goal, onSubmit }: GoalFormProps) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      target: undefined,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (goal) {
        form.reset({
          id: goal.id,
          name: goal.name,
          target: goal.target,
        });
      } else {
        form.reset({
          name: '',
          target: undefined,
        });
      }
    }
  }, [goal, form, isOpen]);

  const handleSubmit = (values: GoalFormValues) => {
    onSubmit({ ...values, id: goal?.id });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{goal ? 'Edit Goal' : 'Add Goal'}</SheetTitle>
          <SheetDescription>
            {goal ? 'Update the details of your financial goal.' : 'Set a new financial goal to work towards.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New Car" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 20000" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit">Save Changes</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

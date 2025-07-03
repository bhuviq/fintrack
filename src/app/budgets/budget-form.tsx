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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOCK_DATA } from '@/lib/data';

const budgetSchema = z.object({
  id: z.number().optional(),
  category: z.string().min(1, { message: 'Please select a category.' }),
  total: z.coerce.number().positive({ message: 'Total must be a positive number.' }),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
type Budget = (typeof MOCK_DATA.budgets)[0];

interface BudgetFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  budget?: Budget | null;
  onSubmit: (data: BudgetFormValues) => void;
  existingCategories: string[];
}

export function BudgetForm({
  isOpen,
  onOpenChange,
  budget,
  onSubmit,
  existingCategories,
}: BudgetFormProps) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: '',
      total: undefined,
    },
  });

  const availableCategories = React.useMemo(() => {
    return MOCK_DATA.categories.filter(c => c.type === 'expense' && (!existingCategories.includes(c.name) || budget?.category === c.name));
  }, [existingCategories, budget]);

  React.useEffect(() => {
    if (isOpen) {
      if (budget) {
        form.reset({
          id: budget.id,
          category: budget.category,
          total: budget.total,
        });
      } else {
        form.reset({
          category: '',
          total: undefined,
        });
      }
    }
  }, [budget, form, isOpen]);

  const handleSubmit = (values: BudgetFormValues) => {
    onSubmit({ ...values, id: budget?.id });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {budget ? 'Edit Budget' : 'Add Budget'}
          </SheetTitle>
          <SheetDescription>
            {budget
              ? 'Update the details of your budget.'
              : 'Add a new budget for a category.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 py-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!budget}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {budget && <SelectItem value={budget.category}>{budget.category}</SelectItem>}
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Budget Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      {...field}
                      value={field.value ?? ''}
                    />
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
              <Button type="submit">Save changes</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

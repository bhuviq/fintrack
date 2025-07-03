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
import { MOCK_DATA } from '@/lib/data';

const investmentSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, {
    message: 'Investment name must be at least 2 characters.',
  }),
  symbol: z.string().min(1, {
    message: 'Symbol is required.',
  }),
  value: z.coerce
    .number()
    .positive({ message: 'Value must be a positive number.' }),
});

export type InvestmentFormValues = z.infer<typeof investmentSchema>;
type Investment = (typeof MOCK_DATA.investments)[0];

interface InvestmentFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  investment?: Investment | null;
  onSubmit: (data: InvestmentFormValues) => void;
}

export function InvestmentForm({
  isOpen,
  onOpenChange,
  investment,
  onSubmit,
}: InvestmentFormProps) {
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: '',
      symbol: '',
      value: undefined,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (investment) {
        form.reset({
          id: investment.id,
          name: investment.name,
          symbol: investment.symbol,
          value: investment.value,
        });
      } else {
        form.reset({
          name: '',
          symbol: '',
          value: undefined,
        });
      }
    }
  }, [investment, form, isOpen]);

  const handleSubmit = (values: InvestmentFormValues) => {
    onSubmit({ ...values, id: investment?.id });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {investment ? 'Edit Investment' : 'Add Investment'}
          </SheetTitle>
          <SheetDescription>
            {investment
              ? 'Update the details of your investment.'
              : 'Add a new investment to your portfolio.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Apple Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. AAPL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 25000.50"
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

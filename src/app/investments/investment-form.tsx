
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
import type { Investment, Category } from '@/lib/types';
import { useCurrency } from '@/context/currency-provider';


const investmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: 'Investment name must be at least 2 characters.',
  }),
  category: z.string().min(1, { message: 'Please select a category.' }),
  symbol: z.string().optional(),
  type: z.string().optional(),
  value: z.coerce
    .number()
    .positive({ message: 'Value must be a positive number.' }),
  currency: z.enum(['USD', 'GBP', 'INR']),
});

export type InvestmentFormValues = z.infer<typeof investmentSchema>;


interface InvestmentFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  investment?: Investment | null;
  onSubmit: (data: InvestmentFormValues) => void;
  availableCategories: Category[];
}

export function InvestmentForm({
  isOpen,
  onOpenChange,
  investment,
  onSubmit,
  availableCategories,
}: InvestmentFormProps) {
  const { currency: globalCurrency } = useCurrency();
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: '',
      category: '',
      symbol: '',
      type: '',
      value: undefined,
      currency: globalCurrency,
    },
  });

  const investmentCategory = form.watch('category');
  
  const showSymbol = React.useMemo(() => {
    return ['Stocks', 'ETF', 'Cryptocurrency'].includes(investmentCategory);
  }, [investmentCategory]);
  
  const showType = React.useMemo(() => {
    return ['Mutual Fund', 'Real Estate', 'Gold'].includes(investmentCategory);
  }, [investmentCategory]);
  
  const typeOptions = React.useMemo(() => {
    if (investmentCategory === 'Mutual Fund') {
        return ['Equity', 'Debt', 'Hybrid'];
    }
    if (investmentCategory === 'Real Estate') {
        return ['Residential', 'Commercial'];
    }
    if (investmentCategory === 'Gold') {
        return ['Physical', 'Bonds', 'ETF'];
    }
    return [];
  }, [investmentCategory]);


  React.useEffect(() => {
    if (isOpen) {
      if (investment) {
        form.reset({
          id: investment.id,
          name: investment.name,
          category: investment.category,
          symbol: investment.symbol,
          type: investment.type,
          value: investment.value,
          currency: investment.currency,
        });
      } else {
        form.reset({
          name: '',
          category: '',
          symbol: '',
          type: '',
          value: undefined,
          currency: globalCurrency,
        });
      }
    }
  }, [investment, form, isOpen, globalCurrency]);

  const handleSubmit = (values: InvestmentFormValues) => {
    const submissionData = { ...values };
    if (!showSymbol) {
        delete submissionData.symbol;
    }
    if (!showType) {
        delete submissionData.type;
    }
    onSubmit({ ...submissionData, id: investment?.id });
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('type', ''); // Reset type when category changes
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an investment category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
            {showSymbol && <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. AAPL" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />}
            {showType && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select a ${investmentCategory} type`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
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
               <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="INR">INR (₹)</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                />
            </div>
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

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import type { InvestmentTransaction, Currency } from '@/lib/types';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const investmentTransactionSchema = z.object({
  type: z.enum(['buy', 'sell']),
  date: z.date(),
  quantity: z.coerce
    .number()
    .positive({ message: 'Quantity must be a positive number.' }),
  price: z.coerce
    .number()
    .positive({ message: 'Price must be a positive number.' }),
  unit: z.enum(['oz', 'gm']).optional(),
});

export type InvestmentTransactionFormValues = z.infer<
  typeof investmentTransactionSchema
>;

interface InvestmentTransactionFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: InvestmentTransactionFormValues, index?: number) => void;
  investmentCategory?: string;
  investmentCurrency?: Currency;
  transaction?: InvestmentTransaction;
  transactionIndex?: number;
}

export function InvestmentTransactionForm({
  isOpen,
  onOpenChange,
  onSubmit,
  investmentCategory,
  investmentCurrency,
  transaction,
  transactionIndex,
}: InvestmentTransactionFormProps) {
  const form = useForm<InvestmentTransactionFormValues>({
    resolver: zodResolver(investmentTransactionSchema),
    defaultValues: {
      type: 'buy',
      date: new Date(),
      quantity: undefined,
      price: undefined,
      unit: undefined,
    },
  });
  
  React.useEffect(() => {
    if (isOpen) {
      if (transaction) {
        const transDate = new Date(transaction.date);
        form.reset({
          type: transaction.type,
          date: isValid(transDate) ? transDate : new Date(),
          quantity: transaction.quantity,
          price: transaction.price,
          unit:
            transaction.unit ||
            (investmentCategory === 'Gold' ? 'oz' : undefined),
        });
      } else {
        form.reset({
          type: 'buy',
          date: new Date(),
          quantity: investmentCategory === 'Real Estate' ? 1 : undefined,
          price: undefined,
          unit: investmentCategory === 'Gold' ? 'oz' : undefined,
        });
      }
    }
  }, [form, isOpen, transaction, investmentCategory]);

  const handleSubmit = (values: InvestmentTransactionFormValues) => {
    onSubmit(values, transactionIndex);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </SheetTitle>
          <SheetDescription>
            {transaction
              ? 'Update the details of this transaction.'
              : 'Record a new buy or sell transaction for this investment.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 py-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="buy" />
                        </FormControl>
                        <FormLabel className="font-normal">Buy</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="sell" />
                        </FormControl>
                        <FormLabel className="font-normal">Sell</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value instanceof Date && isValid(field.value) ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {investmentCategory === 'Gold' ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 1.5"
                          step="any"
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
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue="oz"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="gm">gm</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : investmentCategory !== 'Real Estate' ? (
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={investmentCategory === 'Mutual Funds' ? "e.g. 10.525" : "e.g. 100"}
                        step="any"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per unit (in {investmentCurrency})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 150.75"
                      step="any"
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
              <Button type="submit">Save Transaction</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

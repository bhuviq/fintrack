
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Account } from '@/lib/types';
import { useCurrency } from '@/context/currency-provider';


const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: 'Account name must be at least 2 characters.',
  }),
  type: z.enum(['bank', 'credit-card', 'broker']),
  openingBalance: z.coerce.number(),
  balanceDate: z.date({
    required_error: "An opening balance date is required.",
  }),
  currency: z.enum(['USD', 'GBP', 'INR']),
  limit: z.coerce.number().positive().optional(),
  dueDate: z.coerce.number().min(1).max(31).optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  account?: Account | null;
  onSubmit: (data: AccountFormValues) => void;
}

export function AccountForm({
  isOpen,
  onOpenChange,
  account,
  onSubmit,
}: AccountFormProps) {
  const { currency: globalCurrency } = useCurrency();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'bank',
      openingBalance: 0,
      balanceDate: new Date(),
      currency: globalCurrency,
      limit: undefined,
      dueDate: undefined,
    },
  });

  const accountType = form.watch('type');

  React.useEffect(() => {
    if (isOpen) {
      if (account) {
        form.reset({
          id: account.id,
          name: account.name,
          type: account.type,
          openingBalance: account.openingBalance,
          balanceDate: new Date(account.balanceDate),
          currency: account.currency,
          limit: account.type === 'credit-card' ? account.limit : undefined,
          dueDate: account.type === 'credit-card' ? account.dueDate : undefined,
        });
      } else {
        form.reset({
          id: undefined,
          name: '',
          type: 'bank',
          openingBalance: 0,
          balanceDate: new Date(),
          currency: globalCurrency,
          limit: undefined,
          dueDate: undefined,
        });
      }
    }
  }, [account, form, isOpen, globalCurrency]);

  const handleSubmit = (values: AccountFormValues) => {
    const submissionData = { ...values };
    
    if (submissionData.type === 'credit-card' && submissionData.openingBalance && submissionData.openingBalance > 0) {
      submissionData.openingBalance = -Math.abs(submissionData.openingBalance);
    }
    
    if (submissionData.type === 'broker') {
        submissionData.openingBalance = 0;
    }

    if (submissionData.type === 'bank' || submissionData.type === 'broker') {
      delete submissionData.limit;
      delete submissionData.dueDate;
    }

    onSubmit(submissionData);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {account ? 'Edit Account' : 'Add Account'}
          </SheetTitle>
          <SheetDescription>
            {account
              ? 'Update the details of your account.'
              : 'Add a new bank or credit card account.'}
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
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Chase Checking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!account}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank">Bank Account</SelectItem>
                      <SelectItem value="credit-card">Credit Card</SelectItem>
                      <SelectItem value="broker">Broker Account</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {accountType !== 'broker' && <>
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="openingBalance"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{accountType === 'credit-card' ? 'Initial Outstanding' : 'Opening Balance'}</FormLabel>
                        <FormControl>
                        <Input
                            type="number"
                            placeholder={accountType === 'credit-card' ? "e.g. 1500.00" : "e.g. 5000.00"}
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
                    name="balanceDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>As of Date</FormLabel>
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
                                {field.value instanceof Date && !isNaN(field.value.getTime()) ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                 <FormDescription>
                    The account balance on a specific date, before any transactions you add in the app.
                </FormDescription>
            </>
            }
           

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

            {accountType === 'credit-card' && (
              <>
                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 10000"
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Due Day (1-31)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 15"
                          {...field}
                          value={field.value ?? ''}
                          min={1}
                          max={31}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
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


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
import type { Account, Currency } from '@/lib/types';
import { useCurrency } from '@/context/currency-provider';


const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: 'Account name must be at least 2 characters.',
  }),
  type: z.enum(['bank', 'credit-card']),
  balance: z.coerce.number(),
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
      balance: 0,
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
          balance: account.balance,
          currency: account.currency,
          limit: account.type === 'credit-card' ? account.limit : undefined,
          dueDate: account.type === 'credit-card' ? account.dueDate : undefined,
        });
      } else {
        form.reset({
          name: '',
          type: 'bank',
          balance: 0,
          currency: globalCurrency,
          limit: undefined,
          dueDate: undefined,
        });
      }
    }
  }, [account, form, isOpen, globalCurrency]);

  const handleSubmit = (values: AccountFormValues) => {
    const submissionData: Partial<AccountFormValues> = { ...values };
    
    if (submissionData.type === 'credit-card' && submissionData.balance && submissionData.balance > 0) {
      submissionData.balance = -Math.abs(submissionData.balance);
    }

    if (submissionData.type === 'bank') {
      delete submissionData.limit;
      delete submissionData.dueDate;
    }

    onSubmit({ ...submissionData, id: account?.id } as AccountFormValues);
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
            <div className="grid grid-cols-2 gap-4">
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
                      </SelectContent>
                    </Select>
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
             <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{accountType === 'credit-card' ? 'Initial Outstanding Balance' : 'Opening Balance'}</FormLabel>
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

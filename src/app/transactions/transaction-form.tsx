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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Transaction, Account, Category, Investment } from '@/lib/types';


const transactionSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(2, {
    message: 'Description must be at least 2 characters.',
  }),
  amount: z.coerce
    .number()
    .positive({ message: 'Amount must be a positive number.' }),
  type: z.enum(['income', 'expense', 'transfer', 'investment']),
  date: z.date(),
  category: z.string().optional(),
  accountId: z.string({ required_error: 'Please select an account.' }).min(1, { message: 'Please select an account.'}),
  toAccountId: z.string().optional(),
  investmentId: z.string().optional(),
  investmentQuantity: z.coerce.number().optional(),
}).refine(data => {
    if (data.type === 'transfer') {
        return !!data.toAccountId && data.toAccountId.length > 0;
    }
    return true;
}, {
    message: "Please select a destination account for the transfer.",
    path: ["toAccountId"],
}).refine(data => {
    if (data.type === 'transfer') {
        return data.accountId !== data.toAccountId;
    }
    return true;
}, {
    message: "From and To accounts cannot be the same.",
    path: ["toAccountId"],
}).refine(data => {
    if (data.type === 'investment') {
        return !!data.investmentId && data.investmentId.length > 0;
    }
    return true;
}, {
    message: "Please select an investment.",
    path: ["investmentId"],
}).refine(data => {
    if (data.type === 'investment') {
        return !!data.investmentQuantity && data.investmentQuantity > 0;
    }
    return true;
}, {
    message: "Please enter a positive quantity.",
    path: ["investmentQuantity"],
})
.refine(data => {
    if (data.type !== 'transfer' && data.type !== 'investment') {
        return !!data.category && data.category.length > 0;
    }
    return true;
}, {
    message: "Please select a category.",
    path: ["category"],
});


export type TransactionFormValues = z.infer<typeof transactionSchema>;


interface TransactionFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction?: Transaction | null;
  onSubmit: (data: TransactionFormValues) => void;
  accounts: Account[];
  categories: Category[];
  investments: Investment[];
}

export function TransactionForm({
  isOpen,
  onOpenChange,
  transaction,
  onSubmit,
  accounts,
  categories,
  investments,
}: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: undefined,
      type: 'expense',
      date: new Date(),
      category: '',
      accountId: '',
      toAccountId: '',
      investmentId: '',
      investmentQuantity: undefined,
    },
  });

  const transactionType = form.watch('type');
  const [selectedInvestmentCategory, setSelectedInvestmentCategory] = React.useState('');

  const investmentCategories = React.useMemo(
    () => categories.filter(c => c.type === 'investment'),
    [categories]
  );
  
  const filteredInvestments = React.useMemo(
    () => investments.filter(inv => inv.category === selectedInvestmentCategory),
    [investments, selectedInvestmentCategory]
  );

  const fromAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'credit-card');
  const toAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'credit-card');
  const brokerAccounts = accounts.filter(acc => acc.type === 'broker');

  const availableCategories = React.useMemo(
    () => categories.filter((c) => c.type === transactionType && c.type !== 'investment'),
    [transactionType, categories]
  );
  
  React.useEffect(() => {
    if (isOpen) {
      if (transaction) {
        form.reset({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          date: new Date(transaction.date),
          category: transaction.category,
          accountId: transaction.accountId,
          toAccountId: transaction.toAccountId,
          investmentId: transaction.investmentId,
          investmentQuantity: transaction.investmentQuantity,
        });
        if (transaction.type === 'investment' && transaction.investmentId) {
            const relatedInvestment = investments.find(inv => inv.id === transaction.investmentId);
            if (relatedInvestment) {
                setSelectedInvestmentCategory(relatedInvestment.category);
            }
        } else {
             setSelectedInvestmentCategory('');
        }
      } else {
        form.reset({
          description: '',
          amount: undefined,
          type: 'expense',
          date: new Date(),
          category: '',
          accountId: '',
          toAccountId: '',
          investmentId: '',
          investmentQuantity: undefined,
        });
        setSelectedInvestmentCategory('');
      }
    }
  }, [transaction, form, isOpen, investments]);

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'type' && value.type !== transaction?.type) {
        form.setValue('category', '');
        form.setValue('investmentId', '');
        form.setValue('toAccountId', '');
        form.setValue('accountId', '');
        setSelectedInvestmentCategory('');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, transaction]);


  const handleSubmit = (values: TransactionFormValues) => {
    const submissionData = { ...values };

    if (submissionData.type === 'transfer') {
      submissionData.category = 'Transfer';
    } else if (submissionData.type === 'investment') {
        submissionData.category = 'Investment';
    } else {
      delete submissionData.toAccountId;
      delete submissionData.investmentId;
      delete submissionData.investmentQuantity;
    }

    onSubmit({ ...submissionData, id: transaction?.id } as TransactionFormValues);
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
              ? 'Update the details of your transaction.'
              : 'Add a new transaction to your records.'}
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
                      className="grid grid-cols-2 gap-4"
                      disabled={!!transaction}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expense" />
                        </FormControl>
                        <FormLabel className="font-normal">Expense</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="income" />
                        </FormControl>
                        <FormLabel className="font-normal">Income</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="transfer" />
                        </FormControl>
                        <FormLabel className="font-normal">Transfer</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="investment" />
                        </FormControl>
                        <FormLabel className="font-normal">Investment</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {transactionType === 'transfer' ? (
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>From Account</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {fromAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                {account.name}
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
                    name="toAccountId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>To Account</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {toAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                {account.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            ) : (
                <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{transactionType === 'investment' ? 'From Broker Account' : 'Account'}</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an account" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {(transactionType === 'investment' ? brokerAccounts : accounts).map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                {account.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder={transactionType === 'investment' ? "e.g. Bought AAPL shares" : "e.g. Coffee"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {transactionType === 'investment' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                      <FormLabel>Investment Category</FormLabel>
                      <Select 
                          value={selectedInvestmentCategory}
                          onValueChange={(value) => {
                              setSelectedInvestmentCategory(value);
                              form.setValue('investmentId', ''); // Reset investment on category change
                          }}
                      >
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {investmentCategories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="investmentId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Investment Name</FormLabel>
                        <Select 
                            onValueChange={field.onChange} 
                            value={field.value} 
                            disabled={!selectedInvestmentCategory}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an investment" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {filteredInvestments.map((investment) => (
                                <SelectItem key={investment.id} value={investment.id}>
                                  {investment.name} {investment.symbol && `(${investment.symbol})`}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="investmentQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 10" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Cost</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 2500" {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {transactionType !== 'investment' && (
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 5.50"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
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
                          {field.value ? (
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
            {transactionType !== 'transfer' && transactionType !== 'investment' && (
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                        onValueChange={field.onChange}
                        value={field.value}
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
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

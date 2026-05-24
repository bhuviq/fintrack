'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { CalendarIcon, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import type { Transaction, Account, Category, Investment, InvestmentCharge } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { INVESTMENT_CHARGE_NAMES } from '@/lib/constants';

const chargeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['fixed', 'percentage']),
  value: z.coerce.number().positive('Must be positive'),
});

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
  investmentCharges: z.array(chargeSchema).optional().default([]),
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
  const [chargesOpen, setChargesOpen] = React.useState(false);

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
      investmentCharges: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'investmentCharges',
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

  const fromAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'credit-card' || acc.type === 'broker');
  const toAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'credit-card' || acc.type === 'broker');
  const investmentSourceAccounts = accounts.filter(acc => acc.type === 'broker' || acc.type === 'bank');

  const availableCategories = React.useMemo(
    () => categories.filter((c) => c.type === transactionType && (c.type === 'income' || c.type === 'expense')),
    [transactionType, categories]
  );

  const selectedInvestment = React.useMemo(() => {
    const investmentId = form.watch('investmentId');
    return investments.find(inv => inv.id === investmentId);
  }, [investments, form.watch('investmentId')]);

  React.useEffect(() => {
    if (isOpen) {
      if (transaction) {
        const transDate = new Date(transaction.date);
        form.reset({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          date: isValid(transDate) ? transDate : new Date(),
          category: transaction.category,
          accountId: transaction.accountId,
          toAccountId: transaction.toAccountId,
          investmentId: transaction.investmentId,
          investmentQuantity: transaction.investmentQuantity,
          investmentCharges: [],
        });
        if (transaction.type === 'investment' && transaction.investmentId) {
            const relatedInvestment = investments.find(inv => inv.id === transaction.investmentId);
            if (relatedInvestment) {
                setSelectedInvestmentCategory(relatedInvestment.category);
            }
        } else {
             setSelectedInvestmentCategory('');
        }
        setChargesOpen(false);
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
          investmentCharges: [],
        });
        setSelectedInvestmentCategory('');
        setChargesOpen(false);
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
        form.setValue('investmentCharges', []);
        setSelectedInvestmentCategory('');
        setChargesOpen(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, transaction]);

  // Watched values for cost summary
  const watchedAmount = form.watch('amount');
  const watchedQuantity = form.watch('investmentQuantity');
  const watchedCharges = form.watch('investmentCharges');

  const costSummary = React.useMemo(() => {
    const amount = Number(watchedAmount) || 0;
    const qty = Number(watchedQuantity) || 0;
    const charges = (watchedCharges ?? []) as InvestmentCharge[];

    // For the transaction form, amount = total cost. Charges are additional.
    // Subtotal (base investment) = amount - total fixed charges - percentage-based charges
    // But percentage charges reference the subtotal, creating a circular dependency.
    // Simpler: charges here are computed on the amount (total cost entered), displayed for info.
    const chargesBreakdown = charges.map(c => ({
      name: c.name,
      type: c.type,
      value: c.value,
      amount: c.type === 'percentage' ? amount * (c.value || 0) / 100 : (c.value || 0),
    }));
    const totalCharges = chargesBreakdown.reduce((sum, c) => sum + c.amount, 0);
    const baseAmount = amount - totalCharges;
    const pricePerUnit = qty > 0 ? baseAmount / qty : 0;

    return { chargesBreakdown, totalCharges, baseAmount, pricePerUnit };
  }, [watchedAmount, watchedQuantity, watchedCharges]);

  const formatCurrency = (amount: number) => {
    const currency = selectedInvestment?.currency || 'INR';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleSubmit = (values: TransactionFormValues) => {
    const submissionData: Record<string, unknown> = {
      description: values.description,
      amount: values.amount,
      type: values.type,
      date: values.date,
      accountId: values.accountId,
    };

    if (values.type === 'transfer') {
      submissionData.category = 'Transfer';
      submissionData.toAccountId = values.toAccountId;
    } else if (values.type === 'investment') {
      submissionData.category = 'Investment';
      submissionData.investmentId = values.investmentId;
      submissionData.investmentQuantity = values.investmentQuantity;
      if (values.investmentCharges && values.investmentCharges.length > 0) {
        submissionData.investmentCharges = values.investmentCharges;
      }
    } else {
      submissionData.category = values.category;
    }

    Object.keys(submissionData).forEach(key => submissionData[key] === undefined && delete submissionData[key]);

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
                        <FormLabel>Source Account</FormLabel>
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
                        <FormLabel>Destination Account</FormLabel>
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
                        <FormLabel>{transactionType === 'investment' ? 'From Account' : 'Account'}</FormLabel>
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
                            {(transactionType === 'investment' ? investmentSourceAccounts : accounts).map((account) => (
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
                              form.setValue('investmentId', '');
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

                {/* Charges Section */}
                <Collapsible open={chargesOpen} onOpenChange={setChargesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex w-full items-center justify-between p-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Fees, Taxes & Charges</span>
                        {fields.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {fields.length}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          chargesOpen && 'rotate-180'
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-2">
                        <FormField
                          control={form.control}
                          name={`investmentCharges.${index}.name`}
                          render={({ field: nameField }) => (
                            <FormItem className="flex-1">
                              {index === 0 && <FormLabel className="text-xs">Name</FormLabel>}
                              <Select onValueChange={nameField.onChange} value={nameField.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {INVESTMENT_CHARGE_NAMES.map((name) => (
                                    <SelectItem key={name} value={name}>
                                      {name}
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
                          name={`investmentCharges.${index}.type`}
                          render={({ field: typeField }) => (
                            <FormItem className="w-20">
                              {index === 0 && <FormLabel className="text-xs">Type</FormLabel>}
                              <Select onValueChange={typeField.onChange} value={typeField.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed</SelectItem>
                                  <SelectItem value="percentage">%</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`investmentCharges.${index}.value`}
                          render={({ field: valueField }) => (
                            <FormItem className="w-24">
                              {index === 0 && <FormLabel className="text-xs">Value</FormLabel>}
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="0"
                                  className="h-9"
                                  {...valueField}
                                  value={valueField.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className={cn(index === 0 && 'mt-6')}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => append({ name: '', type: 'fixed', value: 0 })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Charge
                    </Button>
                  </CollapsibleContent>
                </Collapsible>

                {/* Cost Summary */}
                {(Number(watchedAmount) || 0) > 0 && costSummary.totalCharges > 0 && (
                  <div className="rounded-lg border p-3 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Cost (entered)</span>
                      <span>{formatCurrency(Number(watchedAmount) || 0)}</span>
                    </div>
                    {costSummary.chargesBreakdown.map((c, i) => (
                      c.amount > 0 && (
                        <div key={i} className="flex justify-between text-muted-foreground">
                          <span>
                            {c.name || 'Charge'} ({c.type === 'percentage' ? `${c.value}%` : 'fixed'})
                          </span>
                          <span>-{formatCurrency(c.amount)}</span>
                        </div>
                      )
                    ))}
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Base Investment</span>
                      <span>{formatCurrency(costSummary.baseAmount)}</span>
                    </div>
                    {(Number(watchedQuantity) || 0) > 0 && (
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <span>Price per unit</span>
                        <span>{formatCurrency(costSummary.pricePerUnit)}</span>
                      </div>
                    )}
                  </div>
                )}
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

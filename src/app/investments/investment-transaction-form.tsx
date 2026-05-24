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
import type { InvestmentTransaction, Currency } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INVESTMENT_CHARGE_NAMES } from '@/lib/constants';

const chargeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['fixed', 'percentage']),
  value: z.coerce.number().positive('Must be positive'),
});

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
  charges: z.array(chargeSchema).optional().default([]),
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
  const [chargesOpen, setChargesOpen] = React.useState(false);

  const form = useForm<InvestmentTransactionFormValues>({
    resolver: zodResolver(investmentTransactionSchema),
    defaultValues: {
      type: 'buy',
      date: new Date(),
      quantity: undefined,
      price: undefined,
      unit: undefined,
      charges: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'charges',
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
          charges: transaction.charges ?? [],
        });
        if (transaction.charges && transaction.charges.length > 0) {
          setChargesOpen(true);
        }
      } else {
        form.reset({
          type: 'buy',
          date: new Date(),
          quantity: investmentCategory === 'Real Estate' ? 1 : undefined,
          price: undefined,
          unit: investmentCategory === 'Gold' ? 'oz' : undefined,
          charges: [],
        });
        setChargesOpen(false);
      }
    }
  }, [form, isOpen, transaction, investmentCategory]);

  const handleSubmit = (values: InvestmentTransactionFormValues) => {
    onSubmit(values, transactionIndex);
    onOpenChange(false);
  };

  const watchedType = form.watch('type');
  const watchedQuantity = form.watch('quantity');
  const watchedPrice = form.watch('price');
  const watchedCharges = form.watch('charges');

  const subtotal = (Number(watchedQuantity) || 0) * (Number(watchedPrice) || 0);
  const chargesBreakdown = (watchedCharges ?? []).map((c) => {
    const amount = c.type === 'percentage' ? subtotal * (c.value || 0) / 100 : (c.value || 0);
    return { name: c.name, type: c.type, value: c.value, amount };
  });
  const totalCharges = chargesBreakdown.reduce((sum, c) => sum + c.amount, 0);
  const grandTotal = watchedType === 'buy' ? subtotal + totalCharges : subtotal - totalCharges;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: investmentCurrency || 'INR',
    }).format(amount);
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
                      name={`charges.${index}.name`}
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
                      name={`charges.${index}.type`}
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
                      name={`charges.${index}.value`}
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
            {subtotal > 0 && (
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal (qty x price)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {chargesBreakdown.map((c, i) => (
                  c.amount > 0 && (
                    <div key={i} className="flex justify-between text-muted-foreground">
                      <span>
                        {c.name || 'Charge'} ({c.type === 'percentage' ? `${c.value}%` : 'fixed'})
                      </span>
                      <span>{watchedType === 'buy' ? '+' : '-'}{formatCurrency(c.amount)}</span>
                    </div>
                  )
                ))}
                {totalCharges > 0 && (
                  <div className="flex justify-between font-medium pt-1 border-t">
                    <span>Total ({watchedType === 'buy' ? 'Cost' : 'Proceeds'})</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                )}
              </div>
            )}

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

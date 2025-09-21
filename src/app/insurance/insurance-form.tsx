
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Insurance } from '@/lib/types';
import { useCurrency } from '@/context/currency-provider';

const insuranceSchema = z.object({
  id: z.string().optional(),
  policyName: z.string().min(3, { message: 'Policy name must be at least 3 characters.' }),
  insurer: z.string().min(2, { message: 'Insurer name must be at least 2 characters.' }),
  type: z.enum(['Car', 'Health', 'Life', 'Bike', 'Home', 'Other']),
  policyNumber: z.string().min(3, { message: 'Policy number is required.' }),
  coverage: z.coerce.number().positive({ message: 'Coverage must be a positive number.' }),
  premium: z.coerce.number().positive({ message: 'Premium must be a positive number.' }),
  premiumFrequency: z.enum(['monthly', 'quarterly', 'annually']),
  startDate: z.date(),
  endDate: z.date(),
  currency: z.enum(['USD', 'GBP', 'INR']),
});

export type InsuranceFormValues = z.infer<typeof insuranceSchema>;

interface InsuranceFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  insurance?: Insurance | null;
  onSubmit: (data: InsuranceFormValues) => void;
}

export function InsuranceForm({
  isOpen,
  onOpenChange,
  insurance,
  onSubmit,
}: InsuranceFormProps) {
  const { currency: globalCurrency } = useCurrency();
  const form = useForm<InsuranceFormValues>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      policyName: '',
      insurer: '',
      type: 'Health',
      policyNumber: '',
      coverage: undefined,
      premium: undefined,
      premiumFrequency: 'annually',
      startDate: new Date(),
      endDate: new Date(),
      currency: globalCurrency,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (insurance) {
        form.reset({
          id: insurance.id,
          policyName: insurance.policyName,
          insurer: insurance.insurer,
          type: insurance.type,
          policyNumber: insurance.policyNumber,
          coverage: insurance.coverage,
          premium: insurance.premium,
          premiumFrequency: insurance.premiumFrequency,
          startDate: new Date(insurance.startDate),
          endDate: new Date(insurance.endDate),
          currency: insurance.currency,
        });
      } else {
        form.reset({
          policyName: '',
          insurer: '',
          type: 'Health',
          policyNumber: '',
          coverage: undefined,
          premium: undefined,
          premiumFrequency: 'annually',
          startDate: new Date(),
          endDate: new Date(),
          currency: globalCurrency,
        });
      }
    }
  }, [insurance, form, isOpen, globalCurrency]);

  const handleSubmit = (values: InsuranceFormValues) => {
    onSubmit({ ...values, id: insurance?.id });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{insurance ? 'Edit Insurance' : 'Add Insurance'}</SheetTitle>
          <SheetDescription>
            {insurance ? 'Update the details of your insurance policy.' : 'Add a new insurance policy to your tracker.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="policyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. My Health Insurance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="insurer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurer</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Health" {...field} />
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
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Car">Car</SelectItem>
                        <SelectItem value="Bike">Bike</SelectItem>
                        <SelectItem value="Life">Life</SelectItem>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. POL123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage (Sum Insured)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 500000" {...field} value={field.value ?? ''} />
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
                        <SelectTrigger><SelectValue placeholder="Select a currency" /></SelectTrigger>
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
             <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="premium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 15000" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="premiumFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
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
                  name="startDate"
                  render={({ field }) => (
                  <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                      <PopoverTrigger asChild>
                          <FormControl>
                          <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                          </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                      </PopoverContent>
                      </Popover>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                  <FormItem className="flex flex-col">
                      <FormLabel>Renewal / End Date</FormLabel>
                      <Popover>
                      <PopoverTrigger asChild>
                          <FormControl>
                          <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                          </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                      </Popover>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit">Save Changes</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

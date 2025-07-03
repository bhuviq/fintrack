'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { MOCK_DATA } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

type Investment = (typeof MOCK_DATA.investments)[0];

interface InvestmentHistorySheetProps {
  investment: Investment | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTransaction: () => void;
}

export function InvestmentHistorySheet({
  investment,
  isOpen,
  onOpenChange,
  onAddTransaction,
}: InvestmentHistorySheetProps) {
  if (!investment) {
    return null;
  }

  const totalQuantity = investment.history.reduce((acc, item) => {
    return acc + (item.type === 'buy' ? item.quantity : -item.quantity);
  }, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle>History for {investment.name}</SheetTitle>
              <SheetDescription>
                View the transaction history for this investment.
              </SheetDescription>
            </div>
            <Button size="sm" onClick={onAddTransaction}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </SheetHeader>
        <div className="py-4">
          <div className="mb-4">
            <h3 className="font-semibold">Current Holdings</h3>
            <p className="text-sm text-muted-foreground">Total Quantity: {totalQuantity.toLocaleString()}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investment.history.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-muted-foreground">{item.date}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'buy' ? 'secondary' : 'destructive'}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{item.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-medium">${(item.quantity * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}

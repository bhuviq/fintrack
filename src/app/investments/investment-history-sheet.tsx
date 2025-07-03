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
import { Button } from '@/components/ui/button';
import { Edit, MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Investment, InvestmentTransaction } from '@/lib/types';


interface InvestmentHistorySheetProps {
  investment: Investment | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: InvestmentTransaction, index: number) => void;
  onDeleteTransaction: (index: number) => void;
}

export function InvestmentHistorySheet({
  investment,
  isOpen,
  onOpenChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: InvestmentHistorySheetProps) {
  if (!investment) {
    return null;
  }

  const renderTotalHoldings = (investment: Investment) => {
    const { category, history } = investment;

    if (category === 'Gold') {
        const holdings: { [key: string]: number } = {};
        (history as InvestmentTransaction[]).forEach(t => {
            const unit = t.unit || 'oz';
            holdings[unit] = (holdings[unit] || 0) + (t.type === 'buy' ? t.quantity : -t.quantity);
        });

        const formattedHoldings = Object.entries(holdings)
            .filter(([, qty]) => qty > 0.0001) // Avoid floating point dust
            .map(([unit, qty]) => `${qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${unit}`)
            .join(', ');
        
        return `Total Holdings: ${formattedHoldings.length > 0 ? formattedHoldings : '0'}`;
    }

    const totalQuantity = history.reduce((acc, item) => {
        return acc + (item.type === 'buy' ? item.quantity : -item.quantity);
    }, 0);

    return `Total Quantity: ${totalQuantity.toLocaleString()}`;
  };

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
            <p className="text-sm text-muted-foreground">{renderTotalHoldings(investment)}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
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
                  <TableCell className="text-right font-medium">
                    {item.quantity.toLocaleString()}
                    {(item as InvestmentTransaction).unit ? ` ${(item as InvestmentTransaction).unit}` : ''}
                  </TableCell>
                  <TableCell className="text-right font-medium">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-medium">${(item.quantity * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => onEditTransaction(item as InvestmentTransaction, index)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => onDeleteTransaction(index)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}

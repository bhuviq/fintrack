
'use client';

import * as React from 'react';
import { useMemo } from 'react';
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
import type { Investment, InvestmentTransaction, Currency } from '@/lib/types';


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

  const { quantityString, netInvestment } = useMemo(() => {
    if (!investment.history || investment.history.length === 0) {
      return { quantityString: "0", netInvestment: 0 };
    }
    const { category, history } = investment;
    
    const calculatedNetInvestment = history.reduce((acc, t) => {
        const value = t.quantity * t.price;
        return t.type === 'buy' ? acc + value : acc - value;
    }, 0);

    let calculatedQuantityString = "0";

    if (category === 'Gold') {
        const holdings: { [key: string]: number } = {};
        (history as InvestmentTransaction[]).forEach(t => {
            const unit = t.unit || 'oz';
            holdings[unit] = (holdings[unit] || 0) + (t.type === 'buy' ? t.quantity : -t.quantity);
        });

        const formattedHoldings = Object.entries(holdings)
            .filter(([, qty]) => qty > 0.0001)
            .map(([unit, qty]) => `${qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${unit}`)
            .join(', ');
        
        calculatedQuantityString = formattedHoldings.length > 0 ? formattedHoldings : '0';

    } else if (category === 'Real Estate') {
        const totalProperties = history.reduce((acc, item) => acc + (item.type === 'buy' ? 1 : -1), 0);
        calculatedQuantityString = `${totalProperties} propert${totalProperties === 1 ? 'y' : 'ies'}`;
    } else {
        const totalQuantity = history.reduce((acc, item) => {
            return acc + (item.type === 'buy' ? item.quantity : -item.quantity);
        }, 0);
        
        const quantityFormatting: Intl.NumberFormatOptions = (category === "Mutual Funds")
            ? { minimumFractionDigits: 2, maximumFractionDigits: 4 }
            : { minimumFractionDigits: 0, maximumFractionDigits: 2 }

        calculatedQuantityString = totalQuantity.toLocaleString(undefined, quantityFormatting);
    }
    
    return { quantityString: calculatedQuantityString, netInvestment: calculatedNetInvestment };

  }, [investment]);

  const formatAmount = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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
          <div className="mb-4 rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold">Holdings Summary</h3>
            <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
              <span>Total Quantity:</span>
              <span className="font-medium text-right text-foreground">{quantityString}</span>
              <span>Net Investment:</span>
              <span className="font-medium text-right text-foreground">{formatAmount(netInvestment, investment.currency)}</span>
              <span>Current Value:</span>
              <span className="font-medium text-right text-foreground">{formatAmount(investment.value, investment.currency)}</span>
            </div>
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
              {(investment.history || []).map((item, index) => (
                <TableRow key={item.id || index}>
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
                  <TableCell className="text-right font-medium">{formatAmount(item.price, investment.currency)}</TableCell>
                  <TableCell className="text-right font-medium">{formatAmount(item.quantity * item.price, investment.currency)}</TableCell>
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

    
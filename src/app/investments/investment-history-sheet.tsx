
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

  const openingQty = Number(investment.openingQuantity) || 0;
  const openingPrice = Number(investment.openingPrice) || 0;

  const { quantityString, netInvestment, currentTotalValue, totalProfit, totalReturn, averageBuyPrice } = useMemo(() => {
    if ((!investment.history || investment.history.length === 0) && openingQty === 0) {
      return { quantityString: "0", netInvestment: 0, currentTotalValue: 0, totalProfit: 0, totalReturn: 0, averageBuyPrice: 0 };
    }
    const { category, history, value: currentPrice } = investment;

    const buyTransactions = (history || []).filter(t => t.type === 'buy');
    const totalBuyQuantity = buyTransactions.reduce((acc, t) => acc + (category === 'Real Estate' ? 1 : (Number(t.quantity) || 0)), 0) + openingQty;
    const totalBuyCost = buyTransactions.reduce((acc, t) => {
        const qty = category === 'Real Estate' ? 1 : (Number(t.quantity) || 0);
        const price = Number(t.price) || 0;
        return acc + (qty * price);
    }, 0) + (openingQty * openingPrice);
    const averageBuyPrice = totalBuyQuantity > 0 ? totalBuyCost / totalBuyQuantity : 0;

    let totalQuantity = 0;
    let calculatedQuantityString = "0";

    if (category === 'Gold') {
        const holdings: { [key: string]: number } = {};
        ((history || []) as InvestmentTransaction[]).forEach(t => {
            const unit = t.unit || 'oz';
            holdings[unit] = (holdings[unit] || 0) + (t.type === 'buy' ? t.quantity : -t.quantity);
        });
        if (openingQty > 0) {
            holdings['oz'] = (holdings['oz'] || 0) + openingQty;
        }

        const formattedHoldings = Object.entries(holdings)
            .filter(([, qty]) => qty > 0.0001)
            .map(([unit, qty]) => `${qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${unit}`)
            .join(', ');

        calculatedQuantityString = formattedHoldings.length > 0 ? formattedHoldings : '0';
        totalQuantity = Object.values(holdings).reduce((a, b) => a + b, 0);

    } else if (category === 'Real Estate') {
        totalQuantity = (history || []).reduce((acc, item) => acc + (item.type === 'buy' ? 1 : -1), 0) + openingQty;
        calculatedQuantityString = `${totalQuantity} propert${totalQuantity === 1 ? 'y' : 'ies'}`;
    } else {
        totalQuantity = (history || []).reduce((acc, item) => {
            const qty = Number(item.quantity) || 0;
            return acc + (item.type === 'buy' ? qty : -qty);
        }, 0) + openingQty;

        const quantityFormatting: Intl.NumberFormatOptions = (category === "Mutual Funds")
            ? { minimumFractionDigits: 2, maximumFractionDigits: 4 }
            : { minimumFractionDigits: 0, maximumFractionDigits: 2 }

        calculatedQuantityString = totalQuantity.toLocaleString(undefined, quantityFormatting);
    }

    const calculatedCurrentValue = totalQuantity * currentPrice;
    const calculatedNetInvestment = totalQuantity > 0 ? averageBuyPrice * totalQuantity : 0;
    const calculatedProfit = totalQuantity > 0 ? (currentPrice - averageBuyPrice) * totalQuantity : 0;
    const calculatedReturn = (averageBuyPrice > 0 && totalQuantity > 0) ? (calculatedProfit / (averageBuyPrice * totalQuantity)) * 100 : 0;

    return {
      quantityString: calculatedQuantityString,
      netInvestment: calculatedNetInvestment,
      currentTotalValue: calculatedCurrentValue,
      totalProfit: calculatedProfit,
      totalReturn: calculatedReturn,
      averageBuyPrice: averageBuyPrice
    };

  }, [investment, openingQty, openingPrice]);

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
              {openingQty > 0 && (
                <>
                  <span>Opening Balance:</span>
                  <span className="font-medium text-right text-foreground">
                    {openingQty} @ {formatAmount(openingPrice, investment.currency)}
                  </span>
                </>
              )}
              <span>Average Price:</span>
              <span className="font-medium text-right text-foreground">{formatAmount(averageBuyPrice || 0, investment.currency)}</span>
              <span>Net Investment:</span>
              <span className="font-medium text-right text-foreground">{formatAmount(netInvestment || 0, investment.currency)}</span>
              <span>Current Value:</span>
              <span className="font-medium text-right text-foreground">{formatAmount(currentTotalValue || 0, investment.currency)}</span>
              <span>Total Profit:</span>
              <span className={`font-medium text-right ${(totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(totalProfit || 0, investment.currency)} ({(totalReturn || 0).toFixed(2)}%)
              </span>
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
                  <TableCell className="text-right font-medium">
                    {(() => {
                      const invested = item.quantity * item.price;
                      const charges = (item.charges ?? []).reduce((sum, c) =>
                        sum + (c.type === 'percentage' ? invested * c.value / 100 : c.value), 0);
                      return (
                        <span title={charges > 0 ? `Charges: ${formatAmount(charges, investment.currency)} | Total deducted: ${formatAmount(invested + charges, investment.currency)}` : undefined}>
                          {formatAmount(invested, investment.currency)}
                          {charges > 0 && <span className="text-xs text-muted-foreground ml-1">*</span>}
                        </span>
                      );
                    })()}
                  </TableCell>
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

    
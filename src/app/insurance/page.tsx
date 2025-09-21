
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Car, Bike, HeartPulse, Home, ShieldQuestion, LifeBuoy } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getInsurances, addInsurance, updateInsurance, deleteInsurance } from '@/services/insuranceService';
import type { Insurance, NewInsurance, Currency } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { InsuranceForm, type InsuranceFormValues } from './insurance-form';
import { Badge } from '@/components/ui/badge';

export default function InsurancePage() {
  const [insurances, setInsurances] = React.useState<Insurance[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingInsurance, setEditingInsurance] = React.useState<Insurance | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [insuranceToDelete, setInsuranceToDelete] = React.useState<Insurance | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const fetchedInsurances = await getInsurances();
        setInsurances(fetchedInsurances);
    } catch (error: any) {
        console.error("Failed to fetch insurances:", error);
        toast({
            variant: "destructive",
            title: "Network Error",
            description: "Could not connect to the database. Please check your internet connection and Firebase configuration.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (user) {
        fetchData();
    }
  }, [user, fetchData]);

  const handleAddInsurance = () => {
    setEditingInsurance(null);
    setIsSheetOpen(true);
  };

  const handleEditInsurance = (insurance: Insurance) => {
    setEditingInsurance(insurance);
    setIsSheetOpen(true);
  };

  const handleDeleteInsurance = (insurance: Insurance) => {
    setInsuranceToDelete(insurance);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (insuranceToDelete) {
        try {
            await deleteInsurance(insuranceToDelete.id);
            await fetchData();
            toast({ title: "Success", description: "Insurance policy deleted." });
        } catch (error) {
            console.error("Failed to delete insurance:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete policy." });
        }
    }
    setDeleteAlertOpen(false);
    setInsuranceToDelete(null);
  };

  const handleSaveInsurance = async (data: InsuranceFormValues) => {
    try {
        const { id, ...insuranceData } = data;
        const newInsuranceData: NewInsurance = {
            ...insuranceData,
            startDate: format(data.startDate, 'yyyy-MM-dd'),
            endDate: format(data.endDate, 'yyyy-MM-dd'),
        };

        if (id) {
            await updateInsurance(id, newInsuranceData);
            toast({ title: "Success", description: "Policy updated." });
        } else {
            await addInsurance(newInsuranceData);
            toast({ title: "Success", description: "Policy added." });
        }
        await fetchData();
    } catch (error) {
        console.error("Failed to save insurance:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not save policy." });
    }
    setIsSheetOpen(false);
    setEditingInsurance(null);
  };
  
  const formatAmount = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInsuranceIcon = (type: Insurance['type']) => {
    switch (type) {
        case 'Health': return <HeartPulse className="h-6 w-6 text-red-500" />;
        case 'Car': return <Car className="h-6 w-6 text-blue-500" />;
        case 'Bike': return <Bike className="h-6 w-6 text-green-500" />;
        case 'Life': return <LifeBuoy className="h-6 w-6 text-yellow-500" />;
        case 'Home': return <Home className="h-6 w-6 text-purple-500" />;
        case 'Other': return <ShieldQuestion className="h-6 w-6 text-gray-500" />;
        default: return <ShieldQuestion className="h-6 w-6 text-gray-500" />;
    }
  }

  const getDaysUntilRenewal = (endDate: string) => {
    const renewalDate = new Date(endDate);
    const today = new Date();
    const days = differenceInDays(renewalDate, today);
    return days;
  }

  const getRenewalBadge = (days: number) => {
    if (days < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (days <= 30) {
      return <Badge className="bg-yellow-500 text-white">Renews in {days} day{days !== 1 ? 's' : ''}</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Card key={i} className="h-64"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-full w-full" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Insurance Tracker</h1>
          <p className="text-muted-foreground">Manage your insurance policies.</p>
        </div>
        <Button onClick={handleAddInsurance}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Policy
        </Button>
      </div>

      {insurances.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {insurances.map((policy) => {
            const daysToRenewal = getDaysUntilRenewal(policy.endDate);
            return (
                <Card key={policy.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            {getInsuranceIcon(policy.type)}
                            <div>
                                <CardTitle className="pr-10">{policy.policyName}</CardTitle>
                                <CardDescription>{policy.insurer}</CardDescription>
                            </div>
                        </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditInsurance(policy)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteInsurance(policy)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>Policy #</span><span className="font-medium text-right text-foreground">{policy.policyNumber}</span>
                        <span>Coverage</span><span className="font-medium text-right text-foreground">{formatAmount(policy.coverage, policy.currency)}</span>
                        <span>Premium</span><span className="font-medium text-right text-foreground">{formatAmount(policy.premium, policy.currency)}</span>
                        <span>Frequency</span><span className="font-medium text-right text-foreground capitalize">{policy.premiumFrequency}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center text-sm">
                    {getRenewalBadge(daysToRenewal)}
                    <span className="text-muted-foreground">
                        Renews on {format(new Date(policy.endDate), 'MMM d, yyyy')}
                    </span>
                  </CardFooter>
                </Card>
            );
        })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No insurance policies added yet.</p>
            <p className="text-sm text-muted-foreground">Add a policy to get started!</p>
        </div>
      )}

      <InsuranceForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        insurance={editingInsurance}
        onSubmit={handleSaveInsurance}
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this insurance policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { CategoryForm, type CategoryFormValues } from './category-form';
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import type { Category, NewCategory } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);


  const categoryTypes: Category['type'][] = ['expense', 'income', 'investment'];

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
    } catch (error: any) {
        console.error("Failed to fetch categories:", error);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, fetchData]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsSheetOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsSheetOpen(true);
  };
  
  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (categoryToDelete) {
        try {
            await deleteCategory(categoryToDelete.id);
            await fetchData();
        } catch (error) {
            console.error("Failed to delete category:", error);
        }
    }
    setDeleteAlertOpen(false);
    setCategoryToDelete(null);
  };

  const handleSaveCategory = async (data: CategoryFormValues) => {
    try {
        const { id, ...categoryData } = data;
        if (editingCategory && id) {
            await updateCategory(id, categoryData as NewCategory);
        } else {
            await addCategory(categoryData as NewCategory);
        }
        await fetchData();
    } catch (error) {
        console.error("Failed to save category:", error);
    }

    setIsSheetOpen(false);
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Card>
                <CardContent className="p-0">
                    <div className="p-4 border-b">
                        <Skeleton className="h-10 w-64" />
                    </div>
                    <div className="p-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full mt-2" />
                        <Skeleton className="h-12 w-full mt-2" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your transaction categories.
          </p>
        </div>
        <Button onClick={handleAddCategory}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="expense">
            <div className="border-b">
              <TabsList className="p-4">
                {categoryTypes.map((type) => (
                  <TabsTrigger key={type} value={type} className="capitalize">
                    {type}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {categoryTypes.map((type) => (
              <TabsContent key={type} value={type} className="m-0">
                {categories.filter(c => c.type === type).length > 0 ? (
                  <ul className="divide-y">
                    {categories.filter(c => c.type === type).map((category) => (
                      <li key={category.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                        <span className="font-medium">{category.name}</span>
                        {!category.isDefault && (
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        No {type} categories yet.
                    </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <CategoryForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        category={editingCategory}
        onSubmit={handleSaveCategory}
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this category.
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

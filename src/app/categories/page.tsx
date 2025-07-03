'use client';

import * as React from 'react';
import { MOCK_DATA } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { CategoryForm, type CategoryFormValues } from './category-form';

type Category = (typeof MOCK_DATA.categories)[0];

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>(MOCK_DATA.categories.filter(c => c.type !== 'investment'));
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  const categoryTypes: Category['type'][] = ['expense', 'income'];

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsSheetOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsSheetOpen(true);
  };
  
  const handleDeleteCategory = (categoryId: number) => {
    setCategories(categories.filter(c => c.id !== categoryId));
  };

  const handleSaveCategory = (data: CategoryFormValues) => {
    if (editingCategory && data.id) {
      setCategories(
        categories.map((c) =>
          c.id === data.id ? { ...c, ...data, id: c.id } : c
        )
      );
    } else {
      const newCategory: Category = {
        id: Math.max(0, ...categories.map((c) => c.id)) + 1,
        name: data.name,
        type: data.type,
      };
      setCategories([newCategory, ...categories]);
    }
    setIsSheetOpen(false);
    setEditingCategory(null);
  };
  
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
            <div className="p-4 border-b">
              <TabsList>
                {categoryTypes.map((type) => (
                  <TabsTrigger key={type} value={type} className="capitalize">
                    {type}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {categoryTypes.map((type) => (
              <TabsContent key={type} value={type} className="m-0">
                <ul className="divide-y">
                  {categories.filter(c => c.type === type).map((category) => (
                    <li key={category.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                      <span className="font-medium">{category.name}</span>
                       <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
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
    </>
  );
}

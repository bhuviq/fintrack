import { db, auth } from '@/lib/firebase';
import type { Category, NewCategory } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ALL_DEFAULT_CATEGORIES } from '@/lib/constants';

const categoriesCollection = collection(db, 'categories');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

export const getCategories = async (): Promise<Category[]> => {
    const userId = getUserId();
    const q = query(categoriesCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const userCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));

    const defaultCategories: Category[] = ALL_DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        id: `default-${cat.name.toLowerCase().replace(/\s+/g, '-')}-${cat.type}`,
        userId: 'default',
    }));

    const combinedMap = new Map<string, Category>();

    defaultCategories.forEach(cat => {
        combinedMap.set(`${cat.name.toLowerCase()}_${cat.type}`, cat);
    });

    userCategories.forEach(cat => {
        combinedMap.set(`${cat.name.toLowerCase()}_${cat.type}`, cat);
    });

    const allCategories = Array.from(combinedMap.values());
    
    allCategories.sort((a, b) => a.name.localeCompare(b.name));

    return allCategories;
};

export const addCategory = async (categoryData: NewCategory): Promise<string> => {
    const userId = getUserId();
    const docRef = await addDoc(categoriesCollection, { ...categoryData, userId });
    return docRef.id;
}

export const updateCategory = async (id: string, categoryData: Partial<NewCategory>): Promise<void> => {
    const categoryDoc = doc(db, "categories", id);
    await updateDoc(categoryDoc, categoryData);
}

export const deleteCategory = async (id: string): Promise<void> => {
    if (id.startsWith('default-')) {
        throw new Error("Default categories cannot be deleted.");
    }
    await deleteDoc(doc(db, "categories", id));
}

import { db, getCurrentUserId } from '@/lib/firebase';
import type { Category, NewCategory } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const userId = getCurrentUserId();
const categoriesCollection = collection(db, 'categories');

export const getCategories = async (): Promise<Category[]> => {
    const q = query(categoriesCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = async (categoryData: NewCategory): Promise<string> => {
    const docRef = await addDoc(categoriesCollection, { ...categoryData, userId });
    return docRef.id;
}

export const updateCategory = async (id: string, categoryData: Partial<NewCategory>): Promise<void> => {
    const categoryDoc = doc(db, "categories", id);
    await updateDoc(categoryDoc, categoryData);
}

export const deleteCategory = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "categories", id));
}

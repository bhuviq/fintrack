import { db, auth } from '@/lib/firebase';
import type { Category, NewCategory } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

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
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    
    // Sort categories alphabetically by name
    categories.sort((a, b) => a.name.localeCompare(b.name));

    return categories;
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
    await deleteDoc(doc(db, "categories", id));
}

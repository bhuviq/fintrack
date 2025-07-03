import { db, getCurrentUserId } from '@/lib/firebase';
import type { Budget, NewBudget } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const userId = getCurrentUserId();
const budgetsCollection = collection(db, 'budgets');

export const getBudgets = async (): Promise<Budget[]> => {
    const q = query(budgetsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
};

export const addBudget = async (budgetData: NewBudget): Promise<string> => {
    const docRef = await addDoc(budgetsCollection, { ...budgetData, userId });
    return docRef.id;
}

export const updateBudget = async (id: string, budgetData: Partial<NewBudget>): Promise<void> => {
    const budgetDoc = doc(db, "budgets", id);
    await updateDoc(budgetDoc, budgetData);
}

export const deleteBudget = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "budgets", id));
}

import { db, auth } from '@/lib/firebase';
import type { Transaction, NewTransaction } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const transactionsCollection = collection(db, 'transactions');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};


export const getTransactions = async (): Promise<Transaction[]> => {
    const userId = getUserId();
    const q = query(transactionsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const addTransaction = async (transactionData: NewTransaction): Promise<string> => {
    const userId = getUserId();
    const docRef = await addDoc(transactionsCollection, { ...transactionData, userId });
    return docRef.id;
}

export const updateTransaction = async (id: string, transactionData: Partial<NewTransaction>): Promise<void> => {
    const transactionDoc = doc(db, "transactions", id);
    await updateDoc(transactionDoc, transactionData);
}

export const deleteTransaction = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "transactions", id));
}

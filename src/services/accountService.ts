import { db, getCurrentUserId } from '@/lib/firebase';
import type { Account, NewAccount } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const userId = getCurrentUserId();
const accountsCollection = collection(db, 'accounts');

export const getAccounts = async (): Promise<Account[]> => {
    const q = query(accountsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
};

export const addAccount = async (accountData: NewAccount): Promise<string> => {
    const docRef = await addDoc(accountsCollection, { ...accountData, userId });
    return docRef.id;
}

export const updateAccount = async (id: string, accountData: Partial<NewAccount>): Promise<void> => {
    const accountDoc = doc(db, "accounts", id);
    await updateDoc(accountDoc, accountData);
}

export const deleteAccount = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "accounts", id));
}

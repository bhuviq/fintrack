import { db, auth } from '@/lib/firebase';
import type { Account, NewAccount } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const accountsCollection = collection(db, 'accounts');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

export const getAccounts = async (): Promise<Account[]> => {
    const userId = getUserId();
    const q = query(accountsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            status: data.status || 'active', // Default to active if status is not set
        } as Account
    });
};

export const addAccount = async (accountData: NewAccount): Promise<string> => {
    const userId = getUserId();
    const docRef = await addDoc(accountsCollection, { ...accountData, userId, status: 'active' });
    return docRef.id;
}

export const updateAccount = async (id: string, accountData: Partial<NewAccount>): Promise<void> => {
    const accountDoc = doc(db, "accounts", id);
    // Firestore rules should enforce that only the owner can update this.
    await updateDoc(accountDoc, accountData);
}

export const deleteAccount = async (id: string): Promise<void> => {
    // Firestore rules should enforce that only the owner can delete this.
    await deleteDoc(doc(db, "accounts", id));
}

import { db, auth } from '@/lib/firebase';
import type { Investment, NewInvestment, InvestmentTransaction } from '@/lib/types';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const investmentsCollection = collection(db, 'investments');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

export const getInvestments = async (): Promise<Investment[]> => {
    const userId = getUserId();
    const q = query(investmentsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
};

export const addInvestment = async (investmentData: NewInvestment): Promise<string> => {
    const userId = getUserId();
    const docRef = await addDoc(investmentsCollection, { 
        ...investmentData, 
        userId,
        change: 0,
        changeAmount: 0,
        history: [],
    });
    return docRef.id;
};

export const updateInvestment = async (id: string, investmentData: Partial<Investment>): Promise<void> => {
    const investmentDoc = doc(db, "investments", id);
    await updateDoc(investmentDoc, investmentData);
};

export const deleteInvestment = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "investments", id));
};

export const addInvestmentTransaction = async (investmentId: string, transaction: Omit<InvestmentTransaction, 'id'>): Promise<void> => {
    const investmentDocRef = doc(db, 'investments', investmentId);
    const investmentSnap = await getDoc(investmentDocRef);
    
    if (investmentSnap.exists()) {
        const investment = investmentSnap.data() as Investment;
        const newTransaction = { ...transaction, id: new Date().toISOString() };
        const updatedHistory = [...(investment.history || []), newTransaction];
        await updateDoc(investmentDocRef, { history: updatedHistory });
    }
}

export const updateInvestmentTransaction = async (investmentId: string, index: number, transaction: Omit<InvestmentTransaction, 'id'>): Promise<void> => {
    const investmentDocRef = doc(db, 'investments', investmentId);
    const investmentSnap = await getDoc(investmentDocRef);
    
    if (investmentSnap.exists()) {
        const investment = investmentSnap.data() as Investment;
        const updatedHistory = [...(investment.history || [])];
        updatedHistory[index] = { ...transaction, id: updatedHistory[index].id };
        await updateDoc(investmentDocRef, { history: updatedHistory });
    }
}

export const deleteInvestmentTransaction = async (investmentId: string, index: number): Promise<void> => {
    const investmentDocRef = doc(db, 'investments', investmentId);
    const investmentSnap = await getDoc(investmentDocRef);
    
    if (investmentSnap.exists()) {
        const investment = investmentSnap.data() as Investment;
        const updatedHistory = [...(investment.history || [])];
        updatedHistory.splice(index, 1);
        await updateDoc(investmentDocRef, { history: updatedHistory });
    }
}


'use client';

import { db, auth } from '@/lib/firebase';
import type { Transaction, NewTransaction, Investment, InvestmentTransaction, InvestmentCharge } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, getDoc, writeBatch, orderBy, limit, DocumentSnapshot } from 'firebase/firestore';

const transactionsCollection = collection(db, 'transactions');
const investmentsCollection = collection(db, 'investments');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

interface GetTransactionsParams {
    limit?: number;
    filters?: {
        date?: { from?: Date, to?: Date };
    };
}

export const getTransactions = async (params: GetTransactionsParams = {}): Promise<{transactions: Transaction[], nextCursor: DocumentSnapshot | null}> => {
    const { limit: pageSize, filters } = params;
    const userId = getUserId();
    let q = query(transactionsCollection);
    
    // Base query with user and ordering. This requires a composite index on (userId, date desc).
    q = query(q, where("userId", "==", userId), orderBy("date", "desc"));
    
    // Apply date range filter if provided
    if (filters?.date?.from) {
        q = query(q, where("date", ">=", filters.date.from.toISOString().split('T')[0]));
    }
    if (filters?.date?.to) {
        q = query(q, where("date", "<=", filters.date.to.toISOString().split('T')[0]));
    }
    
    if (pageSize) {
      q = query(q, limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    const nextCursor = pageSize ? snapshot.docs[snapshot.docs.length - 1] || null : null;
    
    return { transactions, nextCursor };
};


export const addTransaction = async (transactionData: NewTransaction): Promise<string> => {
    const userId = getUserId();

    if (transactionData.type === 'investment') {
        if (!transactionData.investmentId || !transactionData.investmentQuantity) {
            throw new Error("Investment ID and quantity are required for investment transactions.");
        }

        const investmentDocRef = doc(investmentsCollection, transactionData.investmentId);
        const investmentSnap = await getDoc(investmentDocRef);

        if (!investmentSnap.exists()) {
            throw new Error("Selected investment not found.");
        }

        const investment = investmentSnap.data() as Investment;
        const charges: InvestmentCharge[] = (transactionData as Record<string, unknown>).investmentCharges as InvestmentCharge[] ?? [];

        // Compute total charges to derive base price per unit
        const totalCharges = charges.reduce((sum, c) => {
            return sum + (c.type === 'percentage' ? transactionData.amount * c.value / 100 : c.value);
        }, 0);
        const baseAmount = transactionData.amount - totalCharges;
        const pricePerUnit = baseAmount / transactionData.investmentQuantity;

        const investmentTransaction: Omit<InvestmentTransaction, 'id'> = {
            date: transactionData.date,
            type: 'buy', // Currently only support buying from transaction form
            quantity: transactionData.investmentQuantity,
            price: pricePerUnit,
            ...(charges.length > 0 ? { charges } : {}),
        };

        const newInvestmentHistory = [...(investment.history || []), { ...investmentTransaction, id: new Date().toISOString() }];

        // Use a batch write to ensure both operations succeed or fail together
        const batch = writeBatch(db);

        // 1. Add the main transaction record
        const newTransactionDocRef = doc(collection(db, 'transactions'));
        batch.set(newTransactionDocRef, { ...transactionData, userId, investmentTransactionId: newTransactionDocRef.id });

        // 2. Update the investment's history
        batch.update(investmentDocRef, { history: newInvestmentHistory });

        await batch.commit();
        return newTransactionDocRef.id;

    } else {
        const docRef = await addDoc(transactionsCollection, { ...transactionData, userId });
        return docRef.id;
    }
};

export const updateTransaction = async (id: string, transactionData: Partial<NewTransaction>): Promise<void> => {
    // Note: Investment transactions are not updatable from this generic function
    // to avoid complexity with updating the linked investment history.
    if (transactionData.type === 'investment') {
        throw new Error("Investment transactions cannot be updated from here. Please manage them via the investment's history.");
    }
    const transactionDoc = doc(db, "transactions", id);
    await updateDoc(transactionDoc, transactionData);
};

export const deleteTransaction = async (id: string, type: string, investmentId?: string): Promise<void> => {
    // Deleting an investment transaction from here is complex because we'd need to find the corresponding
    // history item in the investment document. For now, we prevent this. Users should delete
    // from the investment history sheet, which would then trigger the main transaction deletion.
    // This is a potential future improvement.
    if (type === 'investment') {
        throw new Error("Investment transactions cannot be deleted from this view. Please remove the entry from the investment's history page to maintain consistency.");
    }
    await deleteDoc(doc(db, "transactions", id));
};

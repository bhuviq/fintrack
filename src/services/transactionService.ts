
import { db, auth } from '@/lib/firebase';
import type { Transaction, NewTransaction, Investment, InvestmentTransaction } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, getDoc, writeBatch, orderBy, limit, startAfter, endBefore, documentId, limitToLast } from 'firebase/firestore';

const transactionsCollection = collection(db, 'transactions');
const investmentsCollection = collection(db, 'investments');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

interface GetTransactionsParams {
    page: 'first' | 'next' | 'prev';
    cursor?: string | null;
    limitPerPage?: number;
    filters: {
        date?: { from?: Date, to?: Date };
        type?: string;
        account?: string;
        category?: string;
    }
}

export const getTransactions = async ({
    page = 'first',
    cursor = null,
    limitPerPage = 10,
    filters
}: GetTransactionsParams): Promise<{ transactions: Transaction[], nextCursor: string | null }> => {
    const userId = getUserId();
    
    let q = query(transactionsCollection, where("userId", "==", userId));

    // Apply filters
    if (filters.date?.from) {
        q = query(q, where("date", ">=", filters.date.from.toISOString().split('T')[0]));
    }
    if (filters.date?.to) {
        q = query(q, where("date", "<=", filters.date.to.toISOString().split('T')[0]));
    }
    if (filters.type && filters.type !== 'all') {
        q = query(q, where("type", "==", filters.type));
    }
    if (filters.category && filters.category !== 'all') {
        q = query(q, where("category", "==", filters.category));
    }
    if (filters.account && filters.account !== 'all') {
        // This is a common use case, but Firestore doesn't support querying array fields this way.
        // The logic is more complex; we'd need to query for accountId OR toAccountId.
        // For simplicity now, we'll filter on the primary accountId.
        // A more robust solution might involve duplicating data or a more complex query structure.
        q = query(q, where("accountId", "==", filters.account));
    }
    
    q = query(q, orderBy("date", "desc"), orderBy(documentId(), "desc"));
    
    let cursorDocSnap;
    if (cursor && page !== 'first') {
        const cursorDocRef = doc(db, "transactions", cursor);
        cursorDocSnap = await getDoc(cursorDocRef);
        if (!cursorDocSnap.exists()) {
             console.error("Cursor document not found, fetching from the start.");
             // Reset to first page if cursor is invalid
             page = 'first'; 
        }
    }
    
    if (page === 'next' && cursorDocSnap) {
        q = query(q, startAfter(cursorDocSnap));
    } 
    // The 'prev' logic with endBefore and limitToLast is complex and can be error-prone with composite indexes.
    // A simpler, more reliable approach for now is to just fetch from the start on filter changes and handle 'next' page.
    
    q = query(q, limit(limitPerPage));

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    
    const nextCursor = snapshot.docs.length === limitPerPage ? snapshot.docs[snapshot.docs.length - 1].id : null;

    // Return a simplified structure for now. Prev cursor logic is removed to fix the error.
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
        const pricePerUnit = transactionData.amount / transactionData.investmentQuantity;

        const investmentTransaction: Omit<InvestmentTransaction, 'id'> = {
            date: transactionData.date,
            type: 'buy', // Currently only support buying from transaction form
            quantity: transactionData.investmentQuantity,
            price: pricePerUnit,
        };

        const newInvestmentHistory = [...(investment.history || []), { ...investmentTransaction, id: new Date().toISOString() }];

        // Use a batch write to ensure both operations succeed or fail together
        const batch = writeBatch(db);

        // 1. Add the main transaction record
        const newTransactionDocRef = doc(transactionsCollection);
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

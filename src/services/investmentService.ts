
import { db, auth } from '@/lib/firebase';
import type { Investment, NewInvestment, InvestmentTransaction } from '@/lib/types';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, query, where,getCountFromServer, orderBy, limit, startAfter } from 'firebase/firestore';

const investmentsCollection = collection(db, 'investments');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

// This function fetches ALL investments and is used by the dashboard.
export const getInvestments = async (): Promise<Investment[]> => {
    const userId = getUserId();
    const q = query(investmentsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
};

interface GetPaginatedInvestmentsParams {
    page: number;
    pageSize: number;
    category?: string;
}

// This function fetches a paginated list of investments for the investments page.
export const getPaginatedInvestments = async (params: GetPaginatedInvestmentsParams): Promise<{investments: Investment[], totalCount: number}> => {
    const { page, pageSize, category } = params;
    const userId = getUserId();
    
    // Base query for the user's investments
    let q = query(investmentsCollection, where("userId", "==", userId));
    
    // Apply category filter if provided
    if (category) {
        q = query(q, where("category", "==", category));
    }

    // Get total count for pagination
    const countSnapshot = await getCountFromServer(q);
    const totalCount = countSnapshot.data().count;

    // Apply ordering and pagination
    let paginatedQuery = query(q, orderBy("name"));

    if (page > 1) {
        // To get the document to start after, we need to fetch the documents of the previous pages
        const previousPagesQuery = query(paginatedQuery, limit((page - 1) * pageSize));
        const previousPagesSnapshot = await getDocs(previousPagesQuery);
        const lastVisible = previousPagesSnapshot.docs[previousPagesSnapshot.docs.length - 1];
        if(lastVisible) {
            paginatedQuery = query(paginatedQuery, startAfter(lastVisible));
        }
    }
    
    paginatedQuery = query(paginatedQuery, limit(pageSize));

    const snapshot = await getDocs(paginatedQuery);
    const investments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));

    return { investments, totalCount };
}


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
    const updateData = { ...investmentData };

    // Firestore does not store undefined values. If a field should be removed,
    // it's better to explicitly handle it, but for this case, we just ensure
    // we don't send `undefined` which can cause issues.
    if (updateData.symbol === undefined) {
        delete updateData.symbol;
    }
    if (updateData.type === undefined) {
        delete updateData.type;
    }

    await updateDoc(investmentDoc, updateData);
};

export const deleteInvestment = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "investments", id));
};

export const addInvestmentTransaction = async (investmentId: string, transaction: Omit<InvestmentTransaction, 'id'>): Promise<void> => {
    const investmentDocRef = doc(db, 'investments', investmentId);
    const investmentSnap = await getDoc(investmentDocRef);
    
    if (investmentSnap.exists()) {
        const investment = investmentSnap.data() as Investment;
        const newTransaction: InvestmentTransaction = { ...transaction, id: new Date().toISOString() };
        
        if (!transaction.unit) {
            delete (newTransaction as Partial<InvestmentTransaction>).unit;
        }
        
        const updatedHistory = [...(investment.history || []), newTransaction];

        await updateDoc(investmentDocRef, { 
            history: updatedHistory,
        });
    }
}

export const updateInvestmentTransaction = async (investmentId: string, index: number, transaction: Omit<InvestmentTransaction, 'id'>): Promise<void> => {
    const investmentDocRef = doc(db, 'investments', investmentId);
    const investmentSnap = await getDoc(investmentDocRef);
    
    if (investmentSnap.exists()) {
        const investment = investmentSnap.data() as Investment;
        const updatedHistory = [...(investment.history || [])];
        const newTransactionData: InvestmentTransaction = { ...transaction, id: updatedHistory[index].id };

        if (!transaction.unit) {
            delete (newTransactionData as Partial<InvestmentTransaction>).unit;
        }

        updatedHistory[index] = newTransactionData;
        
        await updateDoc(investmentDocRef, { 
            history: updatedHistory
        });
    }
}

export const deleteInvestmentTransaction = async (investmentId: string, index: number): Promise<void> => {
    const investmentDocRef = doc(db, 'investments', investmentId);
    const investmentSnap = await getDoc(investmentDocRef);
    
    if (investmentSnap.exists()) {
        const investment = investmentSnap.data() as Investment;
        const updatedHistory = [...(investment.history || [])];
        updatedHistory.splice(index, 1);

        await updateDoc(investmentDocRef, { 
            history: updatedHistory
        });
    }
}

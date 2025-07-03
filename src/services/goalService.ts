import { db, auth } from '@/lib/firebase';
import type { Goal, NewGoal, GoalContribution } from '@/lib/types';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const goalsCollection = collection(db, 'goals');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

export const getGoals = async (): Promise<Goal[]> => {
    const userId = getUserId();
    const q = query(goalsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
};

export const addGoal = async (goalData: NewGoal): Promise<string> => {
    const userId = getUserId();
    const docRef = await addDoc(goalsCollection, { ...goalData, userId, current: 0, history: [] });
    return docRef.id;
};

export const updateGoal = async (id: string, goalData: Partial<Goal>): Promise<void> => {
    const goalDoc = doc(db, "goals", id);
    await updateDoc(goalDoc, goalData);
};

export const deleteGoal = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "goals", id));
};

export const addContribution = async (goalId: string, contribution: Omit<GoalContribution, 'id'>): Promise<void> => {
    const goalDocRef = doc(db, 'goals', goalId);
    const goalSnap = await getDoc(goalDocRef);
    
    if (goalSnap.exists()) {
        const goal = goalSnap.data() as Goal;
        const newContribution = { ...contribution, id: new Date().toISOString() };
        const updatedHistory = [...(goal.history || []), newContribution];
        const updatedCurrent = updatedHistory.reduce((acc, item) => acc + item.amount, 0);
        await updateDoc(goalDocRef, { history: updatedHistory, current: updatedCurrent });
    }
};

export const deleteContribution = async (goalId: string, contributionId: string): Promise<void> => {
    const goalDocRef = doc(db, 'goals', goalId);
    const goalSnap = await getDoc(goalDocRef);

    if (goalSnap.exists()) {
        const goal = goalSnap.data() as Goal;
        const updatedHistory = (goal.history || []).filter(h => h.id !== contributionId);
        const updatedCurrent = updatedHistory.reduce((acc, item) => acc + item.amount, 0);
        await updateDoc(goalDocRef, { history: updatedHistory, current: updatedCurrent });
    }
};

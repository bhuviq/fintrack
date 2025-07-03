import { db, getCurrentUserId } from '@/lib/firebase';
import type { Goal, NewGoal, GoalContribution } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const userId = getCurrentUserId();
const goalsCollection = collection(db, 'goals');

export const getGoals = async (): Promise<Goal[]> => {
    const q = query(goalsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
};

export const addGoal = async (goalData: NewGoal): Promise<string> => {
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
    const goals = await getGoals();
    const goal = goals.find(g => g.id === goalId);
    
    if (goal) {
        const newContribution = { ...contribution, id: new Date().toISOString() };
        const updatedHistory = [...(goal.history || []), newContribution];
        const updatedCurrent = updatedHistory.reduce((acc, item) => acc + item.amount, 0);
        await updateDoc(goalDocRef, { history: updatedHistory, current: updatedCurrent });
    }
};

export const deleteContribution = async (goalId: string, contributionId: string): Promise<void> => {
    const goalDocRef = doc(db, 'goals', goalId);
    const goals = await getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        const updatedHistory = (goal.history || []).filter(h => h.id !== contributionId);
        const updatedCurrent = updatedHistory.reduce((acc, item) => acc + item.amount, 0);
        await updateDoc(goalDocRef, { history: updatedHistory, current: updatedCurrent });
    }
};

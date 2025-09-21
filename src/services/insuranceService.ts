
import { db, auth } from '@/lib/firebase';
import type { Insurance, NewInsurance } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const insuranceCollection = collection(db, 'insurance');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

export const getInsurances = async (): Promise<Insurance[]> => {
    const userId = getUserId();
    const q = query(insuranceCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Insurance));
};

export const addInsurance = async (insuranceData: NewInsurance): Promise<string> => {
    const userId = getUserId();
    const docRef = await addDoc(insuranceCollection, { ...insuranceData, userId });
    return docRef.id;
}

export const updateInsurance = async (id: string, insuranceData: Partial<NewInsurance>): Promise<void> => {
    const insuranceDoc = doc(db, "insurance", id);
    await updateDoc(insuranceDoc, insuranceData);
}

export const deleteInsurance = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "insurance", id));
}

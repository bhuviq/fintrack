import { db, getCurrentUserId } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const userId = getCurrentUserId();
const userCollection = 'users';

export const getUserProfile = async (): Promise<UserProfile | null> => {
    const userDocRef = doc(db, userCollection, userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    } else {
        // Optionally create a default profile if it doesn't exist
        const defaultProfile: UserProfile = {
            id: userId,
            firstName: 'User',
            lastName: 'Name',
            email: 'user@fintrack.com',
        };
        await setUserProfile(defaultProfile);
        return defaultProfile;
    }
};

export const setUserProfile = async (profile: UserProfile): Promise<void> => {
    const userDocRef = doc(db, userCollection, profile.id);
    await setDoc(userDocRef, profile);
};


export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<void> => {
    const userDocRef = doc(db, userCollection, userId);
    await updateDoc(userDocRef, profileData);
};

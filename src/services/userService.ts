
import { db, auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const userCollection = 'users';

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) {
        // This case should ideally be handled by auth guards in the UI
        // to prevent service calls when logged out.
        throw new Error("User not authenticated");
    }
    return user.uid;
};


export const getUserProfile = async (): Promise<UserProfile | null> => {
    const userId = getUserId();
    const userDocRef = doc(db, userCollection, userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    } else {
        // This should not happen in the normal flow, as the profile is created on sign-up.
        console.warn("User profile document not found.");
        return null;
    }
};

export const setUserProfile = async (profile: UserProfile): Promise<void> => {
    const userDocRef = doc(db, userCollection, profile.id);
    // Use merge to avoid overwriting existing fields if the profile object is partial
    await setDoc(userDocRef, profile, { merge: true });
};


export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<void> => {
    const userId = getUserId();
    const userDocRef = doc(db, userCollection, userId);
    await updateDoc(userDocRef, profileData);
};

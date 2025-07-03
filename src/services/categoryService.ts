
import { db, auth } from '@/lib/firebase';
import type { Category, NewCategory } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch, limit } from 'firebase/firestore';
import { ALL_DEFAULT_CATEGORIES } from '@/lib/constants';

const categoriesCollection = collection(db, 'categories');
const defaultCategoriesCollection = collection(db, 'default-categories');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

// Function to seed default categories if they don't exist
const seedDefaultCategories = async () => {
    const q = query(defaultCategoriesCollection, limit(1));
    const snapshot = await getDocs(q);

    // If the collection is not empty, seeding is already done.
    if (!snapshot.empty) {
        return;
    }
    
    console.log("Seeding default categories into Firestore...");

    const batch = writeBatch(db);
    ALL_DEFAULT_CATEGORIES.forEach(category => {
        // Firestore will auto-generate an ID for the new document
        const newDocRef = doc(defaultCategoriesCollection); 
        batch.set(newDocRef, category);
    });

    try {
        await batch.commit();
        console.log("Default categories successfully seeded.");
    } catch (error) {
        console.error("Error seeding default categories:", error);
        // This might fail due to permissions, but the app should still try to function.
        // The error will be surfaced to the user via the toast on the page.
        throw error;
    }
};

export const getCategories = async (): Promise<Category[]> => {
    const userId = getUserId();

    // This will attempt to seed the default categories only if the collection is empty.
    // If it fails (e.g., due to rules), the promise will reject and the UI will show an error.
    await seedDefaultCategories();

    // Fetch default categories from Firestore
    const defaultSnapshot = await getDocs(defaultCategoriesCollection);
    const defaultCategories: Category[] = defaultSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        isDefault: true,
    } as Category));

    // Fetch user-specific categories from Firestore
    const userQuery = query(categoriesCollection, where("userId", "==", userId));
    const userSnapshot = await getDocs(userQuery);
    const userCategories = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));

    // Combine and sort
    const allCategories = [...defaultCategories, ...userCategories];
    allCategories.sort((a, b) => a.name.localeCompare(b.name));

    return allCategories;
};

export const addCategory = async (categoryData: NewCategory): Promise<string> => {
    const userId = getUserId();
    const docRef = await addDoc(categoriesCollection, { ...categoryData, userId });
    return docRef.id;
}

export const updateCategory = async (id: string, categoryData: Partial<NewCategory>): Promise<void> => {
    const categoryDoc = doc(db, "categories", id);
    await updateDoc(categoryDoc, categoryData);
}

export const deleteCategory = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "categories", id));
}

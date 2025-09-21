
import { db, auth } from '@/lib/firebase';
import type { Category, NewCategory } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch, documentId } from 'firebase/firestore';
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
    try {
        // We will use the category name as the document ID for defaults to prevent duplicates
        const existingDocsSnapshot = await getDocs(defaultCategoriesCollection);
        const existingNames = new Set(existingDocsSnapshot.docs.map(d => d.id));

        const newCategoriesToSeed = ALL_DEFAULT_CATEGORIES.filter(cat => !existingNames.has(cat.name));

        if (newCategoriesToSeed.length === 0) {
            return; // All defaults are already seeded
        }
        
        console.log(`Seeding ${newCategoriesToSeed.length} new default categories into Firestore...`);

        const batch = writeBatch(db);
        newCategoriesToSeed.forEach(category => {
            const newDocRef = doc(defaultCategoriesCollection, category.name); 
            batch.set(newDocRef, {
                name: category.name,
                type: category.type
            });
        });

        await batch.commit();
        console.log("Default categories successfully seeded.");
    } catch (error) {
        console.error("Error seeding default categories. This might be due to Firestore permissions. The app will continue without seeding.", error);
        // We will not re-throw the error, allowing the app to function
        // even if the seeding operation fails.
    }
};

export const getCategories = async (): Promise<Category[]> => {
    const userId = getUserId();

    // Fetch default categories from Firestore
    const defaultSnapshot = await getDocs(defaultCategoriesCollection);
    const defaultCategories: Category[] = defaultSnapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Category, 'id' | 'isDefault'>),
        id: doc.id,
        isDefault: true,
    }));

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
    const docRef = await addDoc(categoriesCollection, { ...categoryData, userId, isDefault: false });
    return docRef.id;
}

export const updateCategory = async (id: string, categoryData: Partial<NewCategory>): Promise<void> => {
    const categoryDoc = doc(db, "categories", id);
    await updateDoc(categoryDoc, categoryData);
}

export const deleteCategory = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "categories", id));
}

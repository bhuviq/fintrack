import { db, auth } from '@/lib/firebase';
import type { Category, NewCategory } from '@/lib/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch, getDoc } from 'firebase/firestore';
import { ALL_DEFAULT_CATEGORIES } from '@/lib/constants';

const categoriesCollection = collection(db, 'categories');

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated. Please log in.");
    return user.uid;
};

// This function will ensure default categories exist in the database.
const ensureDefaultCategories = async () => {
    const defaultCategoriesQuery = query(categoriesCollection, where("userId", "==", "default"));
    const snapshot = await getDocs(defaultCategoriesQuery);

    if (snapshot.empty) {
        // If no default categories, create them in a batch.
        const batch = writeBatch(db);
        ALL_DEFAULT_CATEGORIES.forEach(category => {
            const docRef = doc(collection(db, 'categories')); // Auto-generate ID
            batch.set(docRef, { ...category, userId: 'default' });
        });
        await batch.commit();
    }
};

export const getCategories = async (): Promise<Category[]> => {
    // This function runs a one-time check to seed the database with default categories if they don't exist.
    // After the first run, it will simply fetch the categories from the database.
    await ensureDefaultCategories();

    const userId = getUserId();

    // Fetch both default and user-specific categories in parallel
    const defaultCategoriesQuery = query(categoriesCollection, where("userId", "==", "default"));
    const userCategoriesQuery = query(categoriesCollection, where("userId", "==", userId));

    const [defaultSnapshot, userSnapshot] = await Promise.all([
        getDocs(defaultCategoriesQuery),
        getDocs(userCategoriesQuery)
    ]);

    const defaultCategories = defaultSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    const userCategories = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    
    // User categories should override defaults with the same name and type.
    const combinedMap = new Map<string, Category>();

    defaultCategories.forEach(cat => {
        combinedMap.set(`${cat.name.toLowerCase()}_${cat.type}`, cat);
    });

    userCategories.forEach(cat => {
        combinedMap.set(`${cat.name.toLowerCase()}_${cat.type}`, cat);
    });

    const allCategories = Array.from(combinedMap.values());
    
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
    const categorySnap = await getDoc(categoryDoc);
    if (categorySnap.exists() && categorySnap.data().userId === 'default') {
        throw new Error("Default categories cannot be edited.");
    }
    await updateDoc(categoryDoc, categoryData);
}

export const deleteCategory = async (id: string): Promise<void> => {
    const categoryDoc = doc(db, "categories", id);
    const categorySnap = await getDoc(categoryDoc);
    if (categorySnap.exists() && categorySnap.data().userId === 'default') {
        throw new Error("Default categories cannot be deleted.");
    }
    await deleteDoc(categoryDoc);
}

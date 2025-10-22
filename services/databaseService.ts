// FIX: Added collection, getDocs, onSnapshot, writeBatch, deleteDoc for new admin functionalities.
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, writeBatch, deleteDoc } from "firebase/firestore";
import { db } from './firebaseService';
// FIX: Added UserProfile for type safety in new methods.
import type { UserProgress, StorableEntitlements, UserProfile } from '../types';

const PROGRESS_COLLECTION = 'userProgress';
const ENTITLEMENTS_COLLECTION = 'entitlements';
// FIX: Added constant for the users collection name.
const USERS_COLLECTION = 'users';


class DatabaseService {

    public async getUserProgress(uid: string): Promise<UserProgress | null> {
        if (!uid) return null;
        try {
            const docRef = doc(db, PROGRESS_COLLECTION, uid);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? (docSnap.data() as UserProgress) : null;
        } catch (error) {
            console.error("Error getting user progress:", error);
            return null;
        }
    }

    public async saveUserProgress(uid: string, progress: UserProgress): Promise<void> {
        if (!uid) return;
        try {
            const docRef = doc(db, PROGRESS_COLLECTION, uid);
            await setDoc(docRef, progress, { merge: true });
        } catch (error) {
            console.error("Error saving user progress:", error);
        }
    }

    public async getUserEntitlements(uid: string): Promise<StorableEntitlements | null> {
        if (!uid) return null;
        try {
            const docRef = doc(db, ENTITLEMENTS_COLLECTION, uid);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? (docSnap.data() as StorableEntitlements) : null;
        } catch (error) {
            console.error("Error getting user entitlements:", error);
            return null;
        }
    }

    public async saveUserEntitlements(uid: string, entitlements: StorableEntitlements): Promise<void> {
        if (!uid) return;
        try {
            const docRef = doc(db, ENTITLEMENTS_COLLECTION, uid);
            await setDoc(docRef, entitlements, { merge: true });
        } catch (error) {
            console.error("Error saving user entitlements:", error);
        }
    }

    // FIX: Implemented getAllUserProfiles to fetch all user documents from Firestore for the admin panel.
    public async getAllUserProfiles(): Promise<UserProfile[]> {
        try {
            const usersCollection = collection(db, USERS_COLLECTION);
            const snapshot = await getDocs(usersCollection);
            return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        } catch (error) {
            console.error("Error getting all user profiles:", error);
            return [];
        }
    }

    // FIX: Implemented updateUserProfile to update a user's data in Firestore.
    public async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        if (!uid) return;
        try {
            const docRef = doc(db, USERS_COLLECTION, uid);
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating user profile:", error);
        }
    }

    // FIX: Implemented deleteUserProfile to remove a user's document from Firestore.
    public async deleteUserProfile(uid: string): Promise<void> {
        if (!uid) return;
        try {
            const docRef = doc(db, USERS_COLLECTION, uid);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting user profile:", error);
        }
    }

    // FIX: Implemented a generic subscribe method for realtime updates, used by the admin panel.
    public subscribe(collectionName: string, callback: (docs: any[]) => void): () => void {
        const coll = collection(db, collectionName);
        const unsubscribe = onSnapshot(coll, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(docs);
        });
        return unsubscribe;
    }

    // FIX: Implemented exportDatabase to serialize all relevant collections to JSON.
    public async exportDatabase(): Promise<string> {
        const users = await this.getAllUserProfiles();
        const progressSnap = await getDocs(collection(db, PROGRESS_COLLECTION));
        const entitlementsSnap = await getDocs(collection(db, ENTITLEMENTS_COLLECTION));

        const data = {
            users,
            userProgress: progressSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            entitlements: entitlementsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        };
        return JSON.stringify(data, null, 2);
    }

    // FIX: Implemented importDatabase to restore collections from a JSON backup.
    public async importDatabase(json: string): Promise<{ users: number, progress: number, entitlements: number }> {
        const data = JSON.parse(json);
        const batch = writeBatch(db);

        // Import users
        if (data.users && Array.isArray(data.users)) {
            data.users.forEach((user: UserProfile) => {
                const { uid, ...userData } = user;
                const docRef = doc(db, USERS_COLLECTION, uid);
                batch.set(docRef, userData);
            });
        }
        
        // Import userProgress
        if (data.userProgress && Array.isArray(data.userProgress)) {
            data.userProgress.forEach((progress: any) => {
                const { id, ...progressData } = progress;
                const docRef = doc(db, PROGRESS_COLLECTION, id);
                batch.set(docRef, progressData);
            });
        }

        // Import entitlements
        if (data.entitlements && Array.isArray(data.entitlements)) {
             data.entitlements.forEach((ent: any) => {
                const { id, ...entData } = ent;
                const docRef = doc(db, ENTITLEMENTS_COLLECTION, id);
                batch.set(docRef, entData);
            });
        }
        
        await batch.commit();
        return {
            users: data.users?.length || 0,
            progress: data.userProgress?.length || 0,
            entitlements: data.entitlements?.length || 0
        };
    }
}

export const databaseService = new DatabaseService();

// services/databaseService.ts
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, writeBatch, deleteDoc, updateDoc, Timestamp, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "./firebaseService";
import type { UserProfile, UserProgress, StorableEntitlements } from "../types";

const USERS_COLLECTION = 'users';
const PROGRESS_COLLECTION = 'userProgress';
const ENTITLEMENTS_COLLECTION = 'userEntitlements';

class DatabaseService {
  async getUserProgress(uid: string): Promise<UserProgress | null> {
    const docRef = doc(db, PROGRESS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProgress;
    }
    return null;
  }

  async saveUserProgress(uid: string, progress: UserProgress): Promise<void> {
    const docRef = doc(db, PROGRESS_COLLECTION, uid);
    // Use setDoc with merge to create or update the document
    await setDoc(docRef, progress, { merge: true });
  }
  
  async getUserEntitlements(uid: string): Promise<StorableEntitlements | null> {
    const docRef = doc(db, ENTITLEMENTS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as StorableEntitlements;
    }
    return null;
  }
  
  async saveUserEntitlements(uid: string, entitlements: StorableEntitlements): Promise<void> {
    const docRef = doc(db, ENTITLEMENTS_COLLECTION, uid);
    await setDoc(docRef, entitlements, { merge: true });
  }

  // --- Admin Functions ---

  subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
    const usersCollection = collection(db, USERS_COLLECTION);
    const q = query(usersCollection, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamps to ISO strings for consistency in the app
        const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
        const expiryDate = (data.expiryDate as Timestamp)?.toDate().toISOString() || null;
        users.push({
          uid: doc.id,
          ...data,
          createdAt,
          expiryDate,
        } as UserProfile);
      });
      callback(users);
    }, (error) => {
        console.error("Error subscribing to users:", error);
        callback([]); // Send empty array on error
    });
    return unsubscribe;
  }

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const dataToUpdate: any = { ...data };
    // Convert date string back to Firestore Timestamp before updating
    if (data.expiryDate) {
        dataToUpdate.expiryDate = Timestamp.fromDate(new Date(data.expiryDate));
    }
    await updateDoc(userDocRef, dataToUpdate);
  }

  async deleteUserProfile(uid: string): Promise<void> {
    // This only deletes Firestore data. The Firebase Auth user must be deleted separately (e.g., via console or backend).
    const batch = writeBatch(db);
    batch.delete(doc(db, USERS_COLLECTION, uid));
    batch.delete(doc(db, PROGRESS_COLLECTION, uid));
    batch.delete(doc(db, ENTITLEMENTS_COLLECTION, uid));
    await batch.commit();
  }

  async addUserProfile(profileData: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<string> {
    const usersCollection = collection(db, USERS_COLLECTION);
    const docRef = await addDoc(usersCollection, {
        ...profileData,
        // Ensure expiry date is a Timestamp
        expiryDate: profileData.expiryDate ? Timestamp.fromDate(new Date(profileData.expiryDate)) : null,
        createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  async exportDatabase(): Promise<string> {
    const collectionsToExport = [USERS_COLLECTION, PROGRESS_COLLECTION, ENTITLEMENTS_COLLECTION];
    const dbData: Record<string, any[]> = {};
    
    for (const collectionName of collectionsToExport) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        dbData[collectionName] = querySnapshot.docs.map(d => {
            const data = d.data();
            // Convert any Timestamps to ISO strings for clean JSON
            Object.keys(data).forEach(key => {
                if (data[key] instanceof Timestamp) {
                    data[key] = data[key].toDate().toISOString();
                }
            });
            return { id: d.id, ...data };
        });
    }
    return JSON.stringify(dbData, null, 2);
  }
  
  async importDatabase(jsonString: string): Promise<void> {
      const dbData = JSON.parse(jsonString);
      const batch = writeBatch(db);
      
      for (const collectionName in dbData) {
          if (Object.prototype.hasOwnProperty.call(dbData, collectionName)) {
              const collectionData = dbData[collectionName];
              for (const docData of collectionData) {
                  const { id, ...data } = docData;
                  if (!id) continue; // Skip entries without an ID

                  // Convert date strings back to Timestamps
                  Object.keys(data).forEach(key => {
                      if (typeof data[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data[key])) {
                          data[key] = Timestamp.fromDate(new Date(data[key]));
                      }
                  });

                  const docRef = doc(db, collectionName, id);
                  batch.set(docRef, data);
              }
          }
      }
      await batch.commit();
  }
}

export const databaseService = new DatabaseService();
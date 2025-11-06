// services/firebase.ts

// --- CORE FIREBASE IMPORTS ---
// FIX: Switched to Firebase v9+ modular API to match the project's dependencies.
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
// FIX: Use namespace import for auth to fix module resolution issues.
import * as fbAuth from "firebase/auth";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot,
    collection,
    addDoc,
    query,
    orderBy,
    where,
    updateDoc,
    writeBatch,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    getDocs,
    Firestore
} from "firebase/firestore";


// --- LOCAL IMPORTS ---
import { firebaseConfig } from '../firebaseConfig';
import type { UserProfile, UserProgress, StorableEntitlements, ProblemReport, ReportStatus } from "../types";

// --- SYNCHRONOUS INITIALIZATION ---
let app: FirebaseApp;
// FIX: Use namespace-prefixed type for Auth.
let auth: fbAuth.Auth;
let db: Firestore;
let firebaseInitializationError: Error | null = null;

try {
    // FIX: Use v9+ initialization methods.
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    // FIX: Use namespace-prefixed function for getAuth.
    auth = fbAuth.getAuth(app);
    db = getFirestore(app);
} catch (error: any) {
    console.error("Firebase Initialization Failed:", error);
    // Capture the error to be handled by the application's entry point
    firebaseInitializationError = new Error(`Could not initialize Firebase services. Please check your configuration. Original error: ${error.message}`);
}

// --- EXPORTS ---
// Export the initialized services and the potential error
export { app, auth, db, firebaseInitializationError };


// --- CONSTANTS ---
const USERS_COLLECTION = 'users';
const PROGRESS_COLLECTION = 'userProgress';
const ENTITLEMENTS_COLLECTION = 'userEntitlements';
const REPORTS_COLLECTION = 'problemReports';


// --- AUTH SERVICE LOGIC ---

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // FIX: Use v9 Firestore syntax
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const data = userDocSnap.data()!;
    // FIX: Handle v9 Timestamps
    const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
    const expiryDate = (data.expiryDate as Timestamp)?.toDate().toISOString() || null;
    
    return { ...data, uid, createdAt, expiryDate } as UserProfile;
  } else {
    console.warn(`No user profile found for UID: ${uid}`);
    return null;
  }
}

export function onAuthUserChanged(callback: (user: UserProfile | null) => void): () => void {
  // FIX: Use v9 onAuthStateChanged with namespace.
  return fbAuth.onAuthStateChanged(auth, async (authUser) => {
    if (authUser) {
      const userProfile = await getUserProfile(authUser.uid);
      if(userProfile && userProfile.enabled) {
        const isExpired = userProfile.expiryDate ? new Date(userProfile.expiryDate) < new Date() : false;
        if (isExpired && !userProfile.isAdmin) {
            callback(null);
        } else {
            callback(userProfile);
        }
      } else {
          callback(null);
      }
    } else {
      callback(null);
    }
  });
}

// FIX: Use namespace-prefixed type for User.
export async function register(email: string, password: string, firstName: string, lastName: string): Promise<fbAuth.User> {
  // FIX: Use v9 createUserWithEmailAndPassword with namespace.
  const userCredential = await fbAuth.createUserWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;
  if (!user) {
      throw new Error("User creation failed.");
  }
  // FIX: Use v9 Firestore syntax
  const userDocRef = doc(db, USERS_COLLECTION, user.uid);
  const newUserProfileData = {
    email: user.email!,
    firstName,
    lastName,
    isAdmin: false,
    enabled: true,
    createdAt: serverTimestamp(), // v9 syntax
    expiryDate: null,
  };
  await setDoc(userDocRef, newUserProfileData);
  return user;
}

// FIX: Use namespace-prefixed type for User.
export async function login(email: string, password: string): Promise<fbAuth.User> {
  // FIX: Use v9 signInWithEmailAndPassword with namespace.
  const userCredential = await fbAuth.signInWithEmailAndPassword(auth, email, password);
  if (!userCredential.user) {
      throw new Error("Login failed.");
  }
  return userCredential.user;
}

export async function logout(): Promise<void> {
  // FIX: Use v9 signOut with namespace.
  await fbAuth.signOut(auth);
}

export function subscribeToEntitlements(userId: string, callback: (entitlements: StorableEntitlements | null) => void): () => void {
    // FIX: Use v9 onSnapshot syntax
    const docRef = doc(db, ENTITLEMENTS_COLLECTION, userId);
    return onSnapshot(docRef, (docSnap) => {
        callback(docSnap.exists() ? docSnap.data() as StorableEntitlements : null);
    });
}

// --- PROBLEM REPORTING SERVICE ---
export async function addProblemReport(userId: string, userEmail: string, userName: string, message: string): Promise<void> {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    // FIX: Use v9 Firestore syntax
    await addDoc(collection(db, REPORTS_COLLECTION), {
        userId,
        userEmail,
        userName,
        message,
        timestamp: serverTimestamp(),
        status: 'new'
    });
}

export function subscribeToProblemReports(callback: (reports: ProblemReport[]) => void): () => void {
    // FIX: Use v9 query and onSnapshot syntax
    const q = query(collection(db, REPORTS_COLLECTION), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const reports = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            timestamp: (docSnap.data().timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as ProblemReport));
        callback(reports);
    });
}

export function subscribeToUnreadReportsCount(callback: (count: number) => void): () => void {
    // FIX: Use v9 query and onSnapshot syntax
    const q = query(collection(db, REPORTS_COLLECTION), where("status", "==", "new"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.size);
    });
}

export async function updateProblemReportStatus(reportId: string, status: ReportStatus): Promise<void> {
    // FIX: Use v9 Firestore syntax
    const docRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(docRef, { status });
}


// --- DATABASE SERVICE LOGIC ---

class DatabaseService {
  async getUserProgress(uid: string): Promise<UserProgress | null> {
    // FIX: Use v9 Firestore syntax
    const docRef = doc(db, PROGRESS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProgress : null;
  }

  async saveUserProgress(uid: string, progress: UserProgress): Promise<void> {
    // FIX: Use v9 Firestore syntax
    await setDoc(doc(db, PROGRESS_COLLECTION, uid), progress, { merge: true });
  }
  
  async getUserEntitlements(uid: string): Promise<StorableEntitlements | null> {
    // FIX: Use v9 Firestore syntax
    const docRef = doc(db, ENTITLEMENTS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as StorableEntitlements : null;
  }
  
  async saveUserEntitlements(uid: string, entitlements: StorableEntitlements): Promise<void> {
    // FIX: Use v9 Firestore syntax
    await setDoc(doc(db, ENTITLEMENTS_COLLECTION, uid), entitlements, { merge: true });
  }

  subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
    // FIX: Use v9 query and onSnapshot syntax
    const q = query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
      const users: UserProfile[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
        const expiryDate = (data.expiryDate as Timestamp)?.toDate().toISOString() || null;
        return { uid: docSnap.id, ...data, createdAt, expiryDate } as UserProfile;
      });
      callback(users);
    }, (error) => console.error("Error subscribing to users:", error));
  }

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    // FIX: Use v9 Firestore syntax
    const dataToUpdate: any = { ...data };
    if (data.expiryDate) {
        dataToUpdate.expiryDate = Timestamp.fromDate(new Date(data.expiryDate));
    }
    await updateDoc(doc(db, USERS_COLLECTION, uid), dataToUpdate);
  }

  async deleteUserProfile(uid: string): Promise<void> {
    // FIX: Use v9 batch syntax
    const batch = writeBatch(db);
    batch.delete(doc(db, USERS_COLLECTION, uid));
    batch.delete(doc(db, PROGRESS_COLLECTION, uid));
    batch.delete(doc(db, ENTITLEMENTS_COLLECTION, uid));
    await batch.commit();
  }

  async addUserProfile(profileData: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<string> {
    // FIX: Use v9 Firestore syntax
    const docRef = await addDoc(collection(db, USERS_COLLECTION), {
        ...profileData,
        expiryDate: profileData.expiryDate ? Timestamp.fromDate(new Date(profileData.expiryDate)) : null,
        createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  async exportDatabase(): Promise<string> {
    const collectionsToExport = [USERS_COLLECTION, PROGRESS_COLLECTION, ENTITLEMENTS_COLLECTION, REPORTS_COLLECTION];
    const dbData: Record<string, any[]> = {};
    for (const collectionName of collectionsToExport) {
        // FIX: Use v9 Firestore syntax
        const querySnapshot = await getDocs(collection(db, collectionName));
        dbData[collectionName] = querySnapshot.docs.map(d => {
            const data = d.data();
            Object.keys(data).forEach(key => {
                if (data[key] instanceof Timestamp) data[key] = data[key].toDate().toISOString();
            });
            return { id: d.id, ...data };
        });
    }
    return JSON.stringify(dbData, null, 2);
  }
  
  async importDatabase(jsonString: string): Promise<void> {
      const dbData = JSON.parse(jsonString);
      // FIX: Use v9 batch syntax
      const batch = writeBatch(db);
      for (const collectionName in dbData) {
          if (Object.prototype.hasOwnProperty.call(dbData, collectionName)) {
              for (const docData of dbData[collectionName]) {
                  const { id, ...data } = docData;
                  if (!id) continue;
                  Object.keys(data).forEach(key => {
                      // FIX: Handle v9 Timestamps
                      if (typeof data[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data[key])) {
                          data[key] = Timestamp.fromDate(new Date(data[key]));
                      }
                  });
                  batch.set(doc(db, collectionName, id), data);
              }
          }
      }
      await batch.commit();
  }
}

export const databaseService = new DatabaseService();

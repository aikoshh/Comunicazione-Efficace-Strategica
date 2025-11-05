// services/firebase.ts

// --- SIDE-EFFECT IMPORTS FOR COMPONENT REGISTRATION ---
// This is the most critical part for fixing "Component ... has not been registered yet"
import 'firebase/auth';
import 'firebase/firestore';

// --- CORE FIREBASE IMPORTS ---
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type Auth, type User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, onSnapshot, writeBatch, deleteDoc, updateDoc, Timestamp, addDoc, serverTimestamp, query, orderBy, where, type Firestore } from "firebase/firestore";

// --- LOCAL IMPORTS ---
import { firebaseConfig } from '../firebaseConfig';
import type { UserProfile, UserProgress, StorableEntitlements, ProblemReport, ReportStatus, Product } from "../types";

// --- SYNCHRONOUS INITIALIZATION ---
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let firebaseInitializationError: Error | null = null;

try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error: any) {
    console.error("Firebase Initialization Failed:", error);
    // Capture the error to be handled by the application's entry point
    firebaseInitializationError = new Error(`Component auth has not been registered yet\nCould not initialize Firebase services. Please check your configuration.`);
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
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
    const expiryDate = (data.expiryDate as Timestamp)?.toDate().toISOString() || null;
    
    return { ...data, uid, createdAt, expiryDate } as UserProfile;
  } else {
    console.warn(`No user profile found for UID: ${uid}`);
    return null;
  }
}

export function onAuthUserChanged(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, async (authUser) => {
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

export async function register(email: string, password: string, firstName: string, lastName: string): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;
  const userDocRef = doc(db, USERS_COLLECTION, user.uid);
  const newUserProfileData = {
    email: user.email!,
    firstName,
    lastName,
    isAdmin: false,
    enabled: true,
    createdAt: serverTimestamp(),
    expiryDate: null,
  };
  await setDoc(userDocRef, newUserProfileData);
  return user;
}

export async function login(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

// --- PROBLEM REPORTING SERVICE ---
export async function addProblemReport(userId: string, userEmail: string, userName: string, message: string): Promise<void> {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
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
    const q = query(collection(db, REPORTS_COLLECTION), where("status", "==", "new"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.size);
    });
}

export async function updateProblemReportStatus(reportId: string, status: ReportStatus): Promise<void> {
    await updateDoc(doc(db, REPORTS_COLLECTION, reportId), { status });
}


// --- DATABASE SERVICE LOGIC ---

class DatabaseService {
  async getUserProgress(uid: string): Promise<UserProgress | null> {
    const docRef = doc(db, PROGRESS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProgress : null;
  }

  async saveUserProgress(uid: string, progress: UserProgress): Promise<void> {
    await setDoc(doc(db, PROGRESS_COLLECTION, uid), progress, { merge: true });
  }
  
  async getUserEntitlements(uid: string): Promise<StorableEntitlements | null> {
    const docRef = doc(db, ENTITLEMENTS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as StorableEntitlements : null;
  }
  
  async saveUserEntitlements(uid: string, entitlements: StorableEntitlements): Promise<void> {
    await setDoc(doc(db, ENTITLEMENTS_COLLECTION, uid), entitlements, { merge: true });
  }

  subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
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
    const dataToUpdate: any = { ...data };
    if (data.expiryDate) {
        dataToUpdate.expiryDate = Timestamp.fromDate(new Date(data.expiryDate));
    }
    await updateDoc(doc(db, USERS_COLLECTION, uid), dataToUpdate);
  }

  async deleteUserProfile(uid: string): Promise<void> {
    const batch = writeBatch(db);
    batch.delete(doc(db, USERS_COLLECTION, uid));
    batch.delete(doc(db, PROGRESS_COLLECTION, uid));
    batch.delete(doc(db, ENTITLEMENTS_COLLECTION, uid));
    await batch.commit();
  }

  async addUserProfile(profileData: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<string> {
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
      const batch = writeBatch(db);
      for (const collectionName in dbData) {
          if (Object.prototype.hasOwnProperty.call(dbData, collectionName)) {
              for (const docData of dbData[collectionName]) {
                  const { id, ...data } = docData;
                  if (!id) continue;
                  Object.keys(data).forEach(key => {
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
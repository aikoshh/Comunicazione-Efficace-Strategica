// services/firebase.ts

// --- CORE FIREBASE IMPORTS (V8 COMPATIBILITY SYNTAX) ---
// Import the firebase namespace and the side-effects for the services we need.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// --- LOCAL IMPORTS ---
import { firebaseConfig } from '../firebaseConfig';
import type { UserProfile, UserProgress, StorableEntitlements, ProblemReport, ReportStatus } from "../types";

// --- SYNCHRONOUS INITIALIZATION ---
let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;
let firebaseInitializationError: Error | null = null;

try {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app(); // if already initialized, use that one
    }
    auth = firebase.auth();
    db = firebase.firestore();
} catch (error: any) {
    console.error("Firebase Initialization Failed:", error);
    firebaseInitializationError = new Error(`Could not initialize Firebase services. Please check your configuration. Original error: ${error.message}`);
}

// --- EXPORTS ---
export { app, auth, db, firebaseInitializationError };

// --- TYPE ALIASES for easier conversion ---
type Unsubscribe = () => void;
type User = firebase.User;
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
const Timestamp = firebase.firestore.Timestamp;


// --- CONSTANTS ---
const USERS_COLLECTION = 'users';
const PROGRESS_COLLECTION = 'userProgress';
const ENTITLEMENTS_COLLECTION = 'userEntitlements';
const REPORTS_COLLECTION = 'problemReports';


// --- AUTH SERVICE LOGIC ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
  const userDocSnap = await userDocRef.get();

  if (userDocSnap.exists) {
    const data = userDocSnap.data()!;
    const createdAt = (data.createdAt as firebase.firestore.Timestamp)?.toDate().toISOString() || new Date().toISOString();
    const expiryDate = (data.expiryDate as firebase.firestore.Timestamp)?.toDate().toISOString() || null;
    
    return { ...data, uid, createdAt, expiryDate } as UserProfile;
  } else {
    console.warn(`No user profile found for UID: ${uid}`);
    return null;
  }
}

export function onAuthUserChanged(callback: (user: UserProfile | null) => void): Unsubscribe {
  return auth.onAuthStateChanged(async (authUser) => {
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

export async function register(email: string, password: string, firstName: string, lastName: string): Promise<User> {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const { user } = userCredential;
  if (!user) {
      throw new Error("User creation failed.");
  }
  const userDocRef = db.collection(USERS_COLLECTION).doc(user.uid);
  const newUserProfileData = {
    email: user.email!,
    firstName,
    lastName,
    isAdmin: false,
    enabled: true,
    createdAt: serverTimestamp(),
    expiryDate: null,
  };
  await userDocRef.set(newUserProfileData);
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  if (!userCredential.user) {
      throw new Error("Login failed.");
  }
  return userCredential.user;
}

export async function logout(): Promise<void> {
  await auth.signOut();
}

export function subscribeToEntitlements(userId: string, callback: (entitlements: StorableEntitlements | null) => void): Unsubscribe {
    const docRef = db.collection(ENTITLEMENTS_COLLECTION).doc(userId);
    return docRef.onSnapshot((docSnap) => {
        callback(docSnap.exists ? docSnap.data() as StorableEntitlements : null);
    });
}

// --- PROBLEM REPORTING SERVICE ---
export async function addProblemReport(userId: string, userEmail: string, userName: string, message: string): Promise<void> {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    await db.collection(REPORTS_COLLECTION).add({
        userId,
        userEmail,
        userName,
        message,
        timestamp: serverTimestamp(),
        status: 'new'
    });
}

export function subscribeToProblemReports(callback: (reports: ProblemReport[]) => void): Unsubscribe {
    const q = db.collection(REPORTS_COLLECTION).orderBy("timestamp", "desc");
    return q.onSnapshot((snapshot) => {
        const reports = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            timestamp: (docSnap.data().timestamp as firebase.firestore.Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as ProblemReport));
        callback(reports);
    });
}

export function subscribeToUnreadReportsCount(callback: (count: number) => void): Unsubscribe {
    const q = db.collection(REPORTS_COLLECTION).where("status", "==", "new");
    return q.onSnapshot((snapshot) => {
        callback(snapshot.size);
    });
}

export async function updateProblemReportStatus(reportId: string, status: ReportStatus): Promise<void> {
    const docRef = db.collection(REPORTS_COLLECTION).doc(reportId);
    await docRef.update({ status });
}


// --- DATABASE SERVICE LOGIC ---
class DatabaseService {
  async getUserProgress(uid: string): Promise<UserProgress | null> {
    const docRef = db.collection(PROGRESS_COLLECTION).doc(uid);
    const docSnap = await docRef.get();
    return docSnap.exists ? docSnap.data() as UserProgress : null;
  }

  async saveUserProgress(uid: string, progress: UserProgress): Promise<void> {
    await db.collection(PROGRESS_COLLECTION).doc(uid).set(progress, { merge: true });
  }
  
  async getUserEntitlements(uid: string): Promise<StorableEntitlements | null> {
    const docRef = db.collection(ENTITLEMENTS_COLLECTION).doc(uid);
    const docSnap = await docRef.get();
    return docSnap.exists ? docSnap.data() as StorableEntitlements : null;
  }
  
  async saveUserEntitlements(uid: string, entitlements: StorableEntitlements): Promise<void> {
    await db.collection(ENTITLEMENTS_COLLECTION).doc(uid).set(entitlements, { merge: true });
  }

  subscribeToUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
    const q = db.collection(USERS_COLLECTION).orderBy("createdAt", "desc");
    return q.onSnapshot((querySnapshot) => {
      const users: UserProfile[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const createdAt = (data.createdAt as firebase.firestore.Timestamp)?.toDate().toISOString() || new Date().toISOString();
        const expiryDate = (data.expiryDate as firebase.firestore.Timestamp)?.toDate().toISOString() || null;
        return { uid: docSnap.id, ...data, createdAt, expiryDate } as UserProfile;
      });
      callback(users);
    }, (error) => console.error("Error subscribing to users:", error));
  }

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const dataToUpdate: any = { ...data };
    if (data.expiryDate) {
        dataToUpdate.expiryDate = Timestamp.fromDate(new Date(data.expiryDate));
    } else if (data.expiryDate === null) {
        dataToUpdate.expiryDate = null;
    }
    await db.collection(USERS_COLLECTION).doc(uid).update(dataToUpdate);
  }

  async deleteUserProfile(uid: string): Promise<void> {
    const batch = db.batch();
    batch.delete(db.collection(USERS_COLLECTION).doc(uid));
    batch.delete(db.collection(PROGRESS_COLLECTION).doc(uid));
    batch.delete(db.collection(ENTITLEMENTS_COLLECTION).doc(uid));
    await batch.commit();
  }

  async addUserProfile(profileData: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<string> {
    const docRef = await db.collection(USERS_COLLECTION).add({
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
        const querySnapshot = await db.collection(collectionName).get();
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
      const batch = db.batch();
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
                  batch.set(db.collection(collectionName).doc(id), data);
              }
          }
      }
      await batch.commit();
  }
}

export const databaseService = new DatabaseService();

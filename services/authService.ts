// services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "./firebaseService";
import type { UserProfile } from "../types";

const USERS_COLLECTION = 'users';

/**
 * Fetches the user profile from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    // Convert Firestore Timestamps to ISO strings
    const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
    const expiryDate = (data.expiryDate as Timestamp)?.toDate().toISOString() || null;
    
    return { ...data, uid, createdAt, expiryDate } as UserProfile;
  } else {
    console.warn(`No user profile found for UID: ${uid}`);
    return null;
  }
}

/**
 * Listens for auth state changes and fetches the user profile.
 * The callback receives the UserProfile object or null.
 */
export function onAuthUserChanged(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, async (authUser) => {
    if (authUser) {
      const userProfile = await getUserProfile(authUser.uid);
      if(userProfile && userProfile.enabled) {
        // Check for expiry date
        const isExpired = userProfile.expiryDate ? new Date(userProfile.expiryDate) < new Date() : false;
        if (isExpired && !userProfile.isAdmin) {
            callback(null); // Treat expired user as logged out
        } else {
            callback(userProfile);
        }
      } else {
          callback(null); // User is disabled or profile doesn't exist
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Registers a new user with email and password.
 */
export async function register(email: string, password: string, firstName: string, lastName: string): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;

  // Create user profile in Firestore
  const userDocRef = doc(db, USERS_COLLECTION, user.uid);
  // Firestore handles Timestamps automatically with serverTimestamp()
  const newUserProfileData = {
    email: user.email!,
    firstName,
    lastName,
    isAdmin: false,
    enabled: true,
    createdAt: serverTimestamp(),
    // Set a 7-day trial expiry date
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  await setDoc(userDocRef, newUserProfileData);
  return user;
}

/**
 * Signs in a user with email and password.
 */
export async function login(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Signs out the current user.
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

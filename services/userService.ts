// services/userService.ts
import { databaseService } from "./firebase";
import type { UserProfile } from "../types";

// Note: For production apps, many of these operations should be secured via backend/cloud functions
// that verify admin privileges before execution. This is a simplified client-side version.

class UserService {

  /** Subscribes to real-time updates of the user list. */
  subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
    return databaseService.subscribeToUsers(callback);
  }

  /** Updates a user's profile data in Firestore. */
  async updateUser(uid: string, data: Partial<UserProfile>): Promise<void> {
    return databaseService.updateUserProfile(uid, data);
  }

  /** Deletes a user's profile and related data from Firestore. */
  async deleteUser(uid: string): Promise<void> {
    // This does NOT delete the Firebase Auth user, only their data in Firestore.
    // The Auth user must be deleted from the Firebase Console.
    return databaseService.deleteUserProfile(uid);
  }

  /** Adds a new user profile to Firestore. */
  async addUser(data: { email: string; firstName: string; lastName: string; }): Promise<void> {
    // This only creates the Firestore profile. The user won't be able to log in
    // until an admin creates their account in the Firebase Authentication console.
    const newProfileData: Omit<UserProfile, 'uid' | 'createdAt'> = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      isAdmin: false,
      enabled: true,
      // Set a default expiry date 1 year from now
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await databaseService.addUserProfile(newProfileData);
  }

  /** Exports the entire database as a JSON string. */
  async exportDB(): Promise<string> {
    return databaseService.exportDatabase();
  }

  /** Imports data from a JSON string into the database, overwriting existing data. */
  async importDB(json: string): Promise<void> {
    return databaseService.importDatabase(json);
  }
}

export const userService = new UserService();
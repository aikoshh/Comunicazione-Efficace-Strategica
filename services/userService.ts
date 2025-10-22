// services/userService.ts
// FIX: Changed import from User to UserProfile and aliased as User to match the Firebase data model.
import type { UserProfile as User } from '../types';
import { databaseService } from './databaseService';
// FIX: Imported authService to handle user creation via Firebase Auth.
import { register, logout } from './authService';

class UserManager {
    private users: User[] = [];

    constructor() {
        this.loadUsers();
    }

    // FIX: Refactored loadUsers to fetch profiles from Firestore via databaseService.
    private async loadUsers(): Promise<void> {
        this.users = await databaseService.getAllUserProfiles();
    }
    
    // FIX: Added public reloadUsers to be called from the UI to refresh data.
    public async reloadUsers(): Promise<void> {
        await this.loadUsers();
    }

    public getUser(email: string): User | undefined {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    
    public listUsers(): User[] {
        return [...this.users].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // FIX: Refactored addUser to use Firebase Auth for user creation.
    // This creates a real authentication user and their corresponding profile in Firestore.
    // Note: This will log the admin out and log the new user in as a side-effect of client-side limitations.
    public async addUser(email: string, password: string, firstName: string, lastName: string, isAdmin: boolean = false): Promise<User> {
        if (this.getUser(email)) {
            throw new Error(`L'utente ${email} esiste già.`);
        }
        
        const firebaseUser = await register(email, password, firstName, lastName);

        // Update the created profile with admin status if necessary.
        if (isAdmin) {
             await databaseService.updateUserProfile(firebaseUser.uid, { isAdmin: true });
        }

        // The user is now logged in as the newly created user. We log them out
        // so the admin can log back in.
        await logout();
        
        await this.loadUsers();
        const newUser = this.users.find(u => u.uid === firebaseUser.uid);
        if (!newUser) throw new Error("Failed to find newly created user profile.");

        return newUser;
    }
    
    // FIX: This legacy authenticate method is removed. Authentication is handled by Firebase Auth via authService.

    // FIX: Refactored deleteUser to take uid and delete the Firestore profile.
    // Note: This does not delete the Firebase Auth user, which requires Admin SDK privileges.
    public async deleteUser(uid: string): Promise<boolean> {
        const userIndex = this.users.findIndex(u => u.uid === uid);
        if (userIndex > -1) {
            await databaseService.deleteUserProfile(uid);
            await this.loadUsers();
            return true;
        }
        return false;
    }

    // FIX: Refactored updateUser to work with uid and update the Firestore document.
    public async updateUser(uid: string, updates: Partial<Pick<User, 'firstName' | 'lastName' | 'isAdmin' | 'enabled' | 'expiryDate'>>): Promise<User | null> {
        const user = this.users.find(u => u.uid === uid);
        if (!user) return null;

        await databaseService.updateUserProfile(uid, updates);
        await this.loadUsers();
        return this.users.find(u => u.uid === uid) || null;
    }
    
    // FIX: Refactored to work with Firestore profiles.
    public async extendSubscription(email: string, additionalDays: number = 30): Promise<User | null> {
        const user = this.getUser(email);
        if (!user) return null;
        if (user.isAdmin) return user; // Admins don't have expiry

        const now = new Date();
        const expiry = user.expiryDate ? new Date(user.expiryDate) : now;
        const newExpiry = (expiry < now ? now : expiry);
        newExpiry.setDate(newExpiry.getDate() + additionalDays);
        
        return await this.updateUser(user.uid, {
            expiryDate: newExpiry.toISOString(),
            enabled: true, // Re-enable the user
        });
    }
}

export const userService = new UserManager();

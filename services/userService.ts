// services/userService.ts

import { databaseService } from './databaseService';
import type { User, UserProgress } from '../types';

// Simple "hashing" for demonstration. In a real app, use bcrypt.
const simpleHash = (pass: string) => `hashed_${pass}`;

class UserService {
    // --- User Management ---
    public listUsers(): User[] {
        return databaseService.getAllUsers();
    }

    public getUser(email: string): User | undefined {
        return this.listUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    public async addUser(email: string, pass: string, firstName: string, lastName: string, isAdmin: boolean = false, validityDays: number = 30): Promise<User> {
        if (this.getUser(email)) {
            throw new Error("Un utente con questa email esiste già.");
        }

        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + validityDays);

        const newUser: User = {
            email: email.toLowerCase(),
            passwordHash: simpleHash(pass),
            firstName,
            lastName,
            createdAt: now.toISOString(),
            expiryDate: expiryDate.toISOString(),
            isAdmin,
            enabled: true,
        };

        const allUsers = this.listUsers();
        allUsers.push(newUser);
        await databaseService.saveAllUsers(allUsers);

        // Create initial progress record
        const allProgress = databaseService.getAllProgress();
        const initialProgress: UserProgress = { scores: [], competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 }};
        allProgress[newUser.email] = initialProgress;
        await databaseService.saveAllProgress(allProgress);

        return newUser;
    }

    public async updateUser(email: string, updates: Partial<User> & { password?: string }): Promise<User> {
        const allUsers = this.listUsers();
        const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (userIndex === -1) {
            throw new Error("Utente non trovato.");
        }

        const user = allUsers[userIndex];
        const { password, ...otherUpdates } = updates;

        // Update user data
        allUsers[userIndex] = { ...user, ...otherUpdates };
        
        // Update password if a new one is provided
        if (password) {
            allUsers[userIndex].passwordHash = simpleHash(password);
        }

        await databaseService.saveAllUsers(allUsers);
        return allUsers[userIndex];
    }

    public async deleteUser(email: string): Promise<boolean> {
        const allUsers = this.listUsers();
        const initialLength = allUsers.length;
        const updatedUsers = allUsers.filter(u => u.email.toLowerCase() !== email.toLowerCase());

        if (updatedUsers.length === initialLength) return false; // User not found

        await databaseService.saveAllUsers(updatedUsers);

        // Also delete progress and entitlements
        const allProgress = databaseService.getAllProgress();
        delete allProgress[email.toLowerCase()];
        await databaseService.saveAllProgress(allProgress);
        
        const allEntitlements = databaseService.getAllEntitlements();
        delete allEntitlements[email.toLowerCase()];
        await databaseService.saveAllEntitlements(allEntitlements);

        return true;
    }

    // --- Authentication ---
    public async login(email: string, pass: string): Promise<User> {
        const user = this.getUser(email);

        if (!user) {
            throw new Error("Credenziali non valide.");
        }

        if (user.passwordHash !== simpleHash(pass)) {
            throw new Error("Credenziali non valide.");
        }

        if (!user.enabled) {
            throw new Error("Questo account è stato disabilitato.");
        }

        if (user.expiryDate && new Date(user.expiryDate) < new Date()) {
            throw new Error("Il tuo abbonamento è scaduto. Contatta l'amministratore.");
        }

        return user;
    }

    // --- Subscription Management ---
    public async extendSubscription(email: string, days: number): Promise<User | null> {
        const allUsers = this.listUsers();
        const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (userIndex === -1) return null;

        const user = allUsers[userIndex];
        const now = new Date();
        const currentExpiry = user.expiryDate ? new Date(user.expiryDate) : now;
        
        // If expired, extend from today. If not, extend from the expiry date.
        const newExpiryBase = currentExpiry < now ? now : currentExpiry;
        newExpiryBase.setDate(newExpiryBase.getDate() + days);
        user.expiryDate = newExpiryBase.toISOString();
        
        await databaseService.saveAllUsers(allUsers);
        return user;
    }
}

export const userService = new UserService();

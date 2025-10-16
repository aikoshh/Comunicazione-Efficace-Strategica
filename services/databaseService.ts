import type { Database, User, UserProgress, StorableEntitlements } from '../types';

const DB_STORAGE_KEY = 'ces_coach_database.txt';

class DatabaseService {
    private db: Database;

    constructor() {
        this.db = this.loadDatabase();
    }

    private loadDatabase(): Database {
        try {
            const dbString = localStorage.getItem(DB_STORAGE_KEY);
            if (dbString) {
                const parsedDb = JSON.parse(dbString);
                // Ensure all keys exist to prevent errors on older db versions
                return {
                    users: parsedDb.users || [],
                    userProgress: parsedDb.userProgress || {},
                    entitlements: parsedDb.entitlements || {},
                };
            }
        } catch (e) {
            console.error("Failed to load database from storage, starting fresh.", e);
        }
        // Return a default empty database structure if loading fails
        return {
            users: [],
            userProgress: {},
            entitlements: {},
        };
    }

    private saveDatabase(): void {
        try {
            localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.db));
        } catch (e) {
            console.error("Failed to save database to storage", e);
        }
    }

    // --- Users ---
    public getAllUsers(): User[] {
        return this.db.users;
    }

    public saveAllUsers(users: User[]): void {
        this.db.users = users;
        this.saveDatabase();
    }

    // --- User Progress ---
    public getAllUserProgress(): Record<string, UserProgress> {
        return this.db.userProgress;
    }

    public saveAllUserProgress(progress: Record<string, UserProgress>): void {
        this.db.userProgress = progress;
        this.saveDatabase();
    }

    // --- Entitlements ---
    public getAllEntitlements(): Record<string, StorableEntitlements> {
        return this.db.entitlements;
    }
    
    public saveAllEntitlements(entitlements: Record<string, StorableEntitlements>): void {
        this.db.entitlements = entitlements;
        this.saveDatabase();
    }
}

export const databaseService = new DatabaseService();

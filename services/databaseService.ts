import type { User, UserProgress, StorableEntitlements, Database } from '../types';

const DB_KEY = 'ces_coach_app_state';

class DatabaseService {
    private db: Database;
    private subscribers: (() => void)[] = [];

    constructor() {
        this.db = this.loadDatabase();
    }

    public subscribe(callback: () => void): () => void {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    private notify(): void {
        this.subscribers.forEach(callback => callback());
    }

    private loadDatabase(): Database {
        try {
            const storedState = localStorage.getItem(DB_KEY);
            if (storedState) {
                const parsed = JSON.parse(storedState);
                if (parsed.users && parsed.userProgress && parsed.entitlements) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error('Error loading database from localStorage:', error);
        }
        return { users: [], userProgress: {}, entitlements: {} };
    }

    private saveDatabase(): void {
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(this.db));
            this.notify();
        } catch (error) {
            console.error('Error saving database to localStorage:', error);
        }
    }

    public exportDatabase(): string {
        return JSON.stringify(this.db, null, 2);
    }

    public importDatabase(jsonString: string): { users: number; progress: number; entitlements: number } {
        try {
            const importedDb: Database = JSON.parse(jsonString);

            if (!importedDb || typeof importedDb.users === 'undefined' || typeof importedDb.userProgress === 'undefined' || typeof importedDb.entitlements === 'undefined') {
                throw new Error("Il file JSON non ha una struttura valida (mancano 'users', 'userProgress', o 'entitlements').");
            }
            
            this.db = importedDb;
            this.saveDatabase();

            return {
                users: this.db.users.length,
                progress: Object.keys(this.db.userProgress).length,
                entitlements: Object.keys(this.db.entitlements).length,
            };
        } catch (e: any) {
            console.error("Failed to import database:", e);
            throw new Error(`Errore durante l'importazione: ${e.message}`);
        }
    }

    public getAllUsers(): User[] {
        return JSON.parse(JSON.stringify(this.db.users));
    }

    public saveAllUsers(users: User[]): void {
        this.db.users = users;
        this.saveDatabase();
    }

    public getAllProgress(): Record<string, UserProgress> {
        return JSON.parse(JSON.stringify(this.db.userProgress));
    }

    public saveAllProgress(progress: Record<string, UserProgress>): void {
        this.db.userProgress = progress;
        this.saveDatabase();
    }

    public getAllEntitlements(): Record<string, StorableEntitlements> {
        return JSON.parse(JSON.stringify(this.db.entitlements));
    }
    
    public saveAllEntitlements(entitlements: Record<string, StorableEntitlements>): void {
        this.db.entitlements = entitlements;
        this.saveDatabase();
    }
}

export const databaseService = new DatabaseService();
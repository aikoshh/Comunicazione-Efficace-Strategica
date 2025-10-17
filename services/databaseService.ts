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

    public exportDatabase(): string {
        return JSON.stringify(this.db, null, 2);
    }

    public importDatabase(jsonString: string): void {
        try {
            const newDb = JSON.parse(jsonString);

            if (typeof newDb !== 'object' || newDb === null) {
                throw new Error("Il file non contiene un oggetto JSON valido.");
            }
    
            const missingKeys: string[] = [];
            if (!('users' in newDb)) missingKeys.push('users');
            if (!('userProgress' in newDb)) missingKeys.push('userProgress');
            if (!('entitlements' in newDb)) missingKeys.push('entitlements');
    
            if (missingKeys.length > 0) {
                throw new Error(`Il file di database non è valido. Chiavi mancanti: ${missingKeys.join(', ')}.`);
            }
    
            if (!Array.isArray(newDb.users)) {
                throw new Error("La chiave 'users' nel database deve essere un array.");
            }
            if (typeof newDb.userProgress !== 'object' || Array.isArray(newDb.userProgress)) {
                 throw new Error("La chiave 'userProgress' nel database deve essere un oggetto.");
            }
            if (typeof newDb.entitlements !== 'object' || Array.isArray(newDb.entitlements)) {
                 throw new Error("La chiave 'entitlements' nel database deve essere un oggetto.");
            }

            this.db = newDb as Database;
            this.saveDatabase();
            
        } catch (e: any) {
            console.error("Errore durante l'importazione del database", e);
            if (e instanceof SyntaxError) {
                 throw new Error("Errore nel parsing del file di database. Assicurati che sia un file JSON valido.");
            }
            throw e;
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
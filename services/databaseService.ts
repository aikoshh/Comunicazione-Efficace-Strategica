// services/databaseService.ts
import { initialUserDatabase } from '../database';
import type { User, UserProgress, StorableEntitlements, Database } from '../types';
import { PRODUCTS } from '../products';

const DB_KEY = 'ces_coach_database';

// Helper to simulate password hashing
const simpleHash = (password: string): string => {
  // In a real app, use a strong hashing library like bcrypt.
  // This is just for demonstration.
  return `hashed_${password}`;
};

class DatabaseService {
  private db: Database;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): Database {
    try {
      const storedDb = localStorage.getItem(DB_KEY);
      if (storedDb) {
        return JSON.parse(storedDb);
      }
    } catch (error) {
      console.error("Failed to load database from localStorage, initializing.", error);
    }
    return this.initializeDatabase();
  }

  private initializeDatabase(): Database {
    const newDb: Database = {
      users: [],
      userProgress: {},
      entitlements: {},
    };

    // Parse initial users from the CSV-like string
    initialUserDatabase.trim().split('\n').forEach(line => {
      const [email, password, firstName, lastName] = line.split(',');
      if (email && password && firstName && lastName) {
        newDb.users.push({
          email: email.toLowerCase(),
          passwordHash: simpleHash(password),
          firstName,
          lastName,
          createdAt: new Date().toISOString(),
          expiryDate: email.toLowerCase() === 'admin@ces.coach' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
          isAdmin: email.toLowerCase() === 'admin@ces.coach',
          enabled: true,
        });
      }
    });

    // Give admin user PRO entitlements
    newDb.entitlements['admin@ces.coach'] = {
        productIDs: [PRODUCTS[0].id],
        teamSeats: 1,
        teamActive: false,
    };

    this.saveDatabase(newDb);
    return newDb;
  }

  private saveDatabase(db: Database) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      this.db = db;
    } catch (error) {
      console.error("Failed to save database to localStorage.", error);
    }
  }

  public findUserByEmail(email: string): User | undefined {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public verifyPassword(user: User, pass: string): boolean {
    return user.passwordHash === simpleHash(pass);
  }

  public createUser(data: Omit<User, 'passwordHash' | 'createdAt' | 'expiryDate' | 'isAdmin' | 'enabled'> & { password: string }): User {
    const existingUser = this.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }
    const newUser: User = {
      ...data,
      email: data.email.toLowerCase(),
      passwordHash: simpleHash(data.password),
      createdAt: new Date().toISOString(),
      expiryDate: null, // New users start without an expiry date
      isAdmin: false,
      enabled: true,
    };
    this.db.users.push(newUser);
    this.saveDatabase(this.db);
    return newUser;
  }

  public getUserProgress(email: string): UserProgress {
    return this.db.userProgress[email.toLowerCase()] || { scores: [] };
  }

  public saveUserProgress(email: string, progress: UserProgress) {
    this.db.userProgress[email.toLowerCase()] = progress;
    this.saveDatabase(this.db);
  }

  public getUserEntitlements(email: string): StorableEntitlements {
    return this.db.entitlements[email.toLowerCase()] || { productIDs: [], teamSeats: 0, teamActive: false };
  }

  public saveUserEntitlements(email: string, entitlements: StorableEntitlements) {
    this.db.entitlements[email.toLowerCase()] = entitlements;
    this.saveDatabase(this.db);
  }
  
  // Admin methods
  public getAllUsers(): User[] {
      return [...this.db.users];
  }
  
  public updateUser(updatedUser: User) {
      const userIndex = this.db.users.findIndex(u => u.email === updatedUser.email);
      if (userIndex > -1) {
          this.db.users[userIndex] = updatedUser;
          this.saveDatabase(this.db);
      } else {
          throw new Error("User not found for update.");
      }
  }
}

export const databaseService = new DatabaseService();

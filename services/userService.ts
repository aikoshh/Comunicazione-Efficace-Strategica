// services/userService.ts
import { databaseService } from './databaseService';
import type { User } from '../types';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const userService = {
  async login(email: string, pass: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Simulate network delay
        const user = databaseService.findUserByEmail(email);
        if (user && user.enabled && databaseService.verifyPassword(user, pass)) {
          resolve(user);
        } else if (user && !user.enabled) {
          reject(new Error('This account has been disabled.'));
        }
        else {
          reject(new Error('Invalid email or password.'));
        }
      }, 500);
    });
  },

  async register(data: RegistrationData): Promise<User> {
     return new Promise((resolve, reject) => {
      setTimeout(() => { // Simulate network delay
        try {
          const newUser = databaseService.createUser(data);
          resolve(newUser);
        } catch (error: any) {
          reject(error);
        }
      }, 500);
    });
  },
};

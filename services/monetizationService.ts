import type { Entitlements, Product, User } from '../types';
import { PRODUCTS } from '../products';

const ENTITLEMENTS_STORAGE_KEY_PREFIX = 'ces_coach_entitlements_';

// Helper function to get the storage key for a specific user
const getStorageKey = (userEmail: string): string => `${ENTITLEMENTS_STORAGE_KEY_PREFIX}${userEmail}`;

// Simulate a delay to mimic network latency
const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

const defaultEntitlements: Entitlements = {
    productIDs: new Set(),
    teamSeats: 0,
    teamActive: false,
};

// --- Public API for the service ---

/**
 * Retrieves user entitlements from local storage.
 * If none are found, initializes with default values.
 */
export const getUserEntitlements = async (user: User | null): Promise<Entitlements> => {
    await simulateNetworkDelay(200);
    if (!user) return { ...defaultEntitlements, productIDs: new Set() };

    const key = getStorageKey(user.email);
    const storedData = localStorage.getItem(key);

    if (storedData) {
        try {
            const parsed = JSON.parse(storedData);
            // Convert array of IDs back to a Set
            return { ...defaultEntitlements, ...parsed, productIDs: new Set(parsed.productIDs || []) };
        } catch (error) {
            console.error("Failed to parse entitlements from storage:", error);
            return { ...defaultEntitlements, productIDs: new Set() };
        }
    }

    return { ...defaultEntitlements, productIDs: new Set() };
};

/**
 * Simulates purchasing a product and updates entitlements in local storage.
 */
export const purchaseProduct = async (user: User | null, product: Product): Promise<Entitlements> => {
    await simulateNetworkDelay(1500); // Longer delay for "purchase"
    if (!user) throw new Error("Utente non autenticato. Impossibile completare l'acquisto.");
    
    // In a real app, this would involve StoreKit or a payment provider
    console.log(`Simulating purchase for ${user.email}: ${product.name}`);

    const currentEntitlements = await getUserEntitlements(user);
    const newProductIDs = new Set(currentEntitlements.productIDs);

    newProductIDs.add(product.id);

    const updatedEntitlements: Entitlements = {
        ...currentEntitlements,
        productIDs: newProductIDs,
        teamActive: product.type === 'subscription', // Enable team features if it's a sub
    };

    // Save to storage
    const key = getStorageKey(user.email);
    // Convert Set to Array for JSON serialization
    const storableEntitlements = { ...updatedEntitlements, productIDs: Array.from(updatedEntitlements.productIDs) };
    localStorage.setItem(key, JSON.stringify(storableEntitlements));

    return updatedEntitlements;
};

/**
 * Simulates restoring purchases.
 * In this mock, we just re-read from storage, but in a real app
 * this would hit App Store's APIs.
 */
export const restorePurchases = async (user: User | null): Promise<Entitlements> => {
    await simulateNetworkDelay(1000);
    if (!user) throw new Error("Utente non autenticato. Impossibile ripristinare gli acquisti.");

    console.log(`Simulating restoring purchases for ${user.email}`);
    // Since we are using localStorage, "restoring" is the same as getting.
    // A real implementation would be more complex.
    return getUserEntitlements(user);
};

/**
 * Checks if the user has a specific entitlement.
 */
export const hasEntitlement = (entitlements: Entitlements | null, productId: string): boolean => {
    if (!entitlements) return false;
    return entitlements.productIDs.has(productId);
};

/**
 * Checks if the user has access to any PRO features.
 */
export const hasProAccess = (entitlements: Entitlements | null): boolean => {
    if (!entitlements) return false;
    return entitlements.productIDs.has('ces.pro.monthly');
};

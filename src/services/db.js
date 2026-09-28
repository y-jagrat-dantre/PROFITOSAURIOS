import { ref, get, set, child } from 'firebase/database';
import { realtimeDb } from '../firebase';
import mockData from '../../mock-firebase-data.json';

/**
 * Seeds the entire Firebase Realtime Database with the mock data
 * from mock-firebase-data.json. 
 * This creates all the collections (users, products, etc.) instantly.
 */
export const seedFirebaseWithDummyData = async () => {
  try {
    const dbRef = ref(realtimeDb, '/');
    await set(dbRef, mockData);
    console.log("✅ Firebase Database seeded successfully with mock data!");
    return true;
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    return false;
  }
};

/**
 * Fetch all products from Firebase
 */
export const getProducts = async () => {
  try {
    const snapshot = await get(child(ref(realtimeDb), 'products'));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    console.warn("Products not found in Firebase. Falling back to local dummy data.");
    return mockData.products;
  } catch (error) {
    console.error("Firebase fetch error:", error);
    return mockData.products;
  }
};

/**
 * Fetch all wholesalers from Firebase
 */
export const getWholesalers = async () => {
  try {
    const snapshot = await get(child(ref(realtimeDb), 'users'));
    if (snapshot.exists()) {
      const users = snapshot.val();
      const wholesalers = Object.entries(users)
        .filter(([_, user]) => user.role === 'wholesaler')
        .map(([id, user]) => ({ id, ...user }));
      return wholesalers;
    }
    
    // Fallback to local
    return Object.entries(mockData.users)
      .filter(([_, user]) => user.role === 'wholesaler')
      .map(([id, user]) => ({ id, ...user }));
      
  } catch (error) {
    console.error("Firebase fetch error:", error);
    return [];
  }
};

/**
 * Fetch inventory/optimizations
 */
export const getOptimizations = async () => {
  try {
    const snapshot = await get(child(ref(realtimeDb), 'optimizations'));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return mockData.optimizations;
  } catch (error) {
    return mockData.optimizations;
  }
};

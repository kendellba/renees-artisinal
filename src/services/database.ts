import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDo0Ku4YoR1JyXUaR7FDF8yC5Wk5WTty7o",
  authDomain: "renees-artisinal.firebaseapp.com",
  projectId: "renees-artisinal",
  storageBucket: "renees-artisinal.firebasestorage.app",
  messagingSenderId: "790164459902",
  appId: "1:790164459902:web:e82c40a4be31819a52a32f",
  measurementId: "G-V551YVPGNF"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Export the app for other Firebase services
export { db, auth, app, analytics };

// Whether to use offline storage
const useOfflineStorage = true;

/**
 * Generic database service for all collections
 */
class DatabaseService {
  private collection: string;
  
  constructor(collectionName: string) {
    this.collection = collectionName;
  }
  
  /**
   * Get all documents from a collection
   */
  async getAll() {
    try {
      // Check if we have offline data
      if (useOfflineStorage) {
        const offlineData = localStorage.getItem(this.collection);
        if (offlineData) {
          return JSON.parse(offlineData);
        }
      }
      
      // Otherwise get from Firebase
      const querySnapshot = await getDocs(collection(db, this.collection));
      const items: any[] = [];
      
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      
      // Save to local storage for offline use
      if (useOfflineStorage) {
        localStorage.setItem(this.collection, JSON.stringify(items));
      }
      
      return items;
    } catch (error) {
      console.error(`Error getting ${this.collection}:`, error);
      
      // Fallback to localStorage if there was an error
      const offlineData = localStorage.getItem(this.collection);
      if (offlineData) {
        return JSON.parse(offlineData);
      }
      
      return [];
    }
  }
  
  /**
   * Get a single document by ID
   */
  async getById(id: string) {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        // If not in Firebase, check local storage
        if (useOfflineStorage) {
          const offlineData = localStorage.getItem(this.collection);
          if (offlineData) {
            const items = JSON.parse(offlineData);
            return items.find((item: any) => item.id === id);
          }
        }
        return null;
      }
    } catch (error) {
      console.error(`Error getting ${this.collection} by ID:`, error);
      
      // Fallback to localStorage
      if (useOfflineStorage) {
        const offlineData = localStorage.getItem(this.collection);
        if (offlineData) {
          const items = JSON.parse(offlineData);
          return items.find((item: any) => item.id === id);
        }
      }
      
      return null;
    }
  }
  
  /**
   * Add a new document
   */
  async add(data: any) {
    try {
      // Generate an ID if not provided
      const id = data.id || `${Date.now()}`;
      const docRef = doc(db, this.collection, id);
      
      // Add timestamp
      const dataWithTimestamp = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, dataWithTimestamp);
      
      // Update local storage
      if (useOfflineStorage) {
        const offlineData = localStorage.getItem(this.collection);
        const items = offlineData ? JSON.parse(offlineData) : [];
        items.push({ id, ...dataWithTimestamp });
        localStorage.setItem(this.collection, JSON.stringify(items));
      }
      
      return { id, ...dataWithTimestamp };
    } catch (error) {
      console.error(`Error adding ${this.collection}:`, error);
      
      // Add to local storage even if Firebase fails
      if (useOfflineStorage) {
        const id = data.id || `${Date.now()}`;
        const dataWithTimestamp = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pendingSync: true // Mark for sync when online
        };
        
        const offlineData = localStorage.getItem(this.collection);
        const items = offlineData ? JSON.parse(offlineData) : [];
        items.push(dataWithTimestamp);
        localStorage.setItem(this.collection, JSON.stringify(items));
        
        return dataWithTimestamp;
      }
      
      throw error;
    }
  }
  
  /**
   * Update a document
   */
  async update(id: string, data: any) {
    try {
      const docRef = doc(db, this.collection, id);
      
      // Add timestamp
      const dataWithTimestamp = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, dataWithTimestamp);
      
      // Update local storage
      if (useOfflineStorage) {
        const offlineData = localStorage.getItem(this.collection);
        if (offlineData) {
          const items = JSON.parse(offlineData);
          const index = items.findIndex((item: any) => item.id === id);
          
          if (index !== -1) {
            items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
            localStorage.setItem(this.collection, JSON.stringify(items));
          }
        }
      }
      
      return { id, ...data };
    } catch (error) {
      console.error(`Error updating ${this.collection}:`, error);
      
      // Update local storage even if Firebase fails
      if (useOfflineStorage) {
        const offlineData = localStorage.getItem(this.collection);
        if (offlineData) {
          const items = JSON.parse(offlineData);
          const index = items.findIndex((item: any) => item.id === id);
          
          if (index !== -1) {
            items[index] = { 
              ...items[index], 
              ...data, 
              updatedAt: new Date().toISOString(),
              pendingSync: true // Mark for sync when online
            };
            localStorage.setItem(this.collection, JSON.stringify(items));
            return items[index];
          }
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Delete a document
   */
  async delete(id: string) {
    try {
      const docRef = doc(db, this.collection, id);
      await deleteDoc(docRef);
      
      // Update local storage
      if (useOfflineStorage) {
        const offlineData = localStorage.getItem(this.collection);
        if (offlineData) {
          const items = JSON.parse(offlineData);
          const filteredItems = items.filter((item: any) => item.id !== id);
          localStorage.setItem(this.collection, JSON.stringify(filteredItems));
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.collection}:`, error);
      
      // Update local storage even if Firebase fails
      if (useOfflineStorage) {
        const offlineData = localStorage.getItem(this.collection);
        if (offlineData) {
          const items = JSON.parse(offlineData);
          const filteredItems = items.filter((item: any) => item.id !== id);
          
          // Add to deleted items list to sync later
          const deletedItems = localStorage.getItem(`${this.collection}_deleted`) || '[]';
          const deletedItemsList = JSON.parse(deletedItems);
          deletedItemsList.push(id);
          
          localStorage.setItem(this.collection, JSON.stringify(filteredItems));
          localStorage.setItem(`${this.collection}_deleted`, JSON.stringify(deletedItemsList));
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Sync pending changes with server
   */
  async syncWithServer() {
    if (!useOfflineStorage) return;
    
    // Get items marked for sync
    const offlineData = localStorage.getItem(this.collection);
    if (!offlineData) return;
    
    const items = JSON.parse(offlineData);
    const pendingItems = items.filter((item: any) => item.pendingSync);
    
    // Process each pending item
    for (const item of pendingItems) {
      try {
        const { id, pendingSync, ...data } = item;
        const docRef = doc(db, this.collection, id);
        await setDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
        
        // Remove pending sync flag
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], pendingSync: false };
        }
      } catch (error) {
        console.error(`Error syncing ${this.collection}:`, error);
      }
    }
    
    // Process deleted items
    const deletedItems = localStorage.getItem(`${this.collection}_deleted`);
    if (deletedItems) {
      const deletedIds = JSON.parse(deletedItems);
      
      for (const id of deletedIds) {
        try {
          const docRef = doc(db, this.collection, id);
          await deleteDoc(docRef);
        } catch (error) {
          console.error(`Error syncing deleted ${this.collection}:`, error);
        }
      }
      
      // Clear deleted items
      localStorage.setItem(`${this.collection}_deleted`, '[]');
    }
    
    // Update localStorage
    localStorage.setItem(this.collection, JSON.stringify(items));
  }
}

// Auth functions
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Create database service instances for each collection
export const productsDB = new DatabaseService('products');
export const salesDB = new DatabaseService('sales');
export const purchasesDB = new DatabaseService('purchases');
export const customersDB = new DatabaseService('customers');
export const inventoryDB = new DatabaseService('inventory');
export const invoicesDB = new DatabaseService('invoices');
export const settingsDB = new DatabaseService('settings'); 
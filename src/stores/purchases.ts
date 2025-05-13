import { defineStore } from 'pinia';
import { useProductsStore } from './products';

export interface PurchaseItem {
  productId: string | number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
}

export interface Purchase {
  id: string | number;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  supplier: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  invoiceReceiptNumber?: string;
  paymentMethod?: string;
}

interface PurchasesState {
  purchases: Purchase[];
  loading: boolean;
  error: string | null;
}

export const usePurchasesStore = defineStore('purchases', {
  state: (): PurchasesState => ({
    purchases: [],
    loading: false,
    error: null,
  }),

  getters: {
    getPurchaseById: (state) => (id: number) => {
      return state.purchases.find(purchase => purchase.id === id);
    },

    getPurchasesByDateRange: (state) => (startDate: string, endDate: string) => {
      return state.purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.date);
        return purchaseDate >= new Date(startDate) && purchaseDate <= new Date(endDate);
      });
    },

    getTotalPurchases: (state) => {
      return state.purchases.reduce((total, purchase) => total + purchase.totalAmount, 0);
    },

    getPurchasesCount: (state) => {
      return state.purchases.length;
    },

    currentDayPurchasesTotal(): number {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const endOfToday = new Date(today.setHours(23, 59, 59, 999));
      const purchases = this.getPurchasesByDateRange(
        startOfToday.toISOString().split('T')[0],
        endOfToday.toISOString().split('T')[0]
      );
      return purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    },

    currentWeekPurchasesTotal(): number {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(today.setDate(today.getDate() + 6));
      const purchases = this.getPurchasesByDateRange(
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
      );
      return purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    },

    currentMonthPurchasesTotal(): number {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const purchases = this.getPurchasesByDateRange(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );
      return purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    }
  },

  actions: {
    loadPurchases() {
      const storedPurchases = localStorage.getItem('purchases');
      if (storedPurchases) {
        this.purchases = JSON.parse(storedPurchases);
      }
    },
    async fetchPurchases() {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        // For now, using mock data
        this.purchases = [
          {
            id: 1,
            date: '2024-03-15',
            items: [
              { productId: 1, itemName: "Coffee Beans - Arabica", quantity: 10, unitPrice: 12.99, totalCost: 129.90 },
              { productId: 2, itemName: "Milk - Whole", quantity: 5, unitPrice: 3.99, totalCost: 19.95 }
            ],
            totalAmount: 149.85,
            supplier: 'Coffee Supplier Inc.',
            status: 'completed',
            notes: 'Regular monthly order'
          },
          {
            id: 2,
            date: '2024-03-14',
            items: [
              { productId: 3, itemName: "Sugar - White", quantity: 20, unitPrice: 2.49, totalCost: 49.80 }
            ],
            totalAmount: 49.80,
            supplier: 'Bakery Supplies Co.',
            status: 'completed'
          }
        ];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch purchases';
      } finally {
        this.loading = false;
      }
    },

    async addPurchase(purchase: Omit<Purchase, 'id'>) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        const newPurchase = {
          ...purchase,
          id: Math.max(0, ...this.purchases.map(p => typeof p.id === 'string' ? parseInt(p.id) : p.id)) + 1
        };
        this.purchases.push(newPurchase);

        // Update product stock levels
        const productsStore = useProductsStore();
        for (const item of purchase.items) {
          // Convert productId to number if it's a string
          const productIdNum = typeof item.productId === 'string' ? parseInt(item.productId) : item.productId;
          await productsStore.updateStock(productIdNum, item.quantity);
        }

        return newPurchase;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add purchase';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updatePurchase(id: string | number, updates: Partial<Purchase>) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        const index = this.purchases.findIndex(p => p.id === id);
        if (index === -1) {
          throw new Error('Purchase not found');
        }
        this.purchases[index] = { ...this.purchases[index], ...updates };
        return this.purchases[index];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update purchase';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deletePurchase(id: string | number) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        const index = this.purchases.findIndex(p => p.id === id);
        if (index === -1) {
          throw new Error('Purchase not found');
        }
        const purchaseToDelete = this.purchases[index];
        this.purchases.splice(index, 1);

        // Revert stock levels
        const productsStore = useProductsStore();
        for (const item of purchaseToDelete.items) {
          // Convert productId to number if it's a string
          const productIdNum = typeof item.productId === 'string' ? parseInt(item.productId) : item.productId;
          await productsStore.updateStock(productIdNum, -item.quantity);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete purchase';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
}); 
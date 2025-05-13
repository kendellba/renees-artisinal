import { defineStore } from 'pinia';
import { useProductsStore } from './products';

export interface SaleItem {
  productId: number | string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  notes?: string;
}

export interface Payment {
  method: string;
  amount: number;
  details?: string;
}

export interface Sale {
  id: number | string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  totalAmount: number;
  paymentMethod: string;
  status?: 'completed' | 'cancelled' | 'refunded';
  tax?: number;
  tipAmount?: number;
  customerId?: number | string;
  payments?: Payment[];
}

interface SalesState {
  sales: Sale[];
  loading: boolean;
  error: string | null;
}

// Helper function for date calculations
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

const getEndOfWeek = (date: Date) => {
  const startOfWeek = getStartOfWeek(date);
  return new Date(startOfWeek.setDate(startOfWeek.getDate() + 6));
};

const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getEndOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const useSalesStore = defineStore('sales', {
  state: (): SalesState => ({
    sales: [],
    loading: false,
    error: null,
  }),

  getters: {
    getSaleById: (state) => (id: number | string) => {
      return state.sales.find(sale => sale.id === id);
    },

    getSalesByDateRange: (state) => (startDate: string, endDate: string) => {
      return state.sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      });
    },

    getTotalSales: (state) => {
      return state.sales.reduce((total, sale) => total + sale.totalAmount, 0);
    },

    getTotalTax: (state) => {
      return state.sales.reduce((total, sale) => total + (sale.tax || 0), 0);
    },

    getSalesCount: (state) => {
      return state.sales.length;
    },

    currentDaySalesTotal(): number {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const endOfToday = new Date(today.setHours(23, 59, 59, 999));
      const sales = this.getSalesByDateRange(
        startOfToday.toISOString().split('T')[0],
        endOfToday.toISOString().split('T')[0]
      );
      return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    },

    currentWeekSalesTotal(): number {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(today.setDate(today.getDate() + 6));
      const sales = this.getSalesByDateRange(
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
      );
      return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    },

    currentMonthSalesTotal(): number {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const sales = this.getSalesByDateRange(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );
      return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    },

    calculateProfitForSales(): (sales: Sale[]) => number {
      return (sales: Sale[]): number => {
        const productsStore = useProductsStore();
        let totalProfit = 0;
        sales.forEach(sale => {
          sale.items.forEach(item => {
            // Convert productId to number if it's a string
            const productIdNum = typeof item.productId === 'string' ? parseInt(item.productId) : item.productId;
            const product = productsStore.getProductById(productIdNum);
            if (product) {
              totalProfit += (item.pricePerUnit - product.cost) * item.quantity;
            }
          });
        });
        return totalProfit;
      };
    },

    topSellingProducts() {
      return (count: number, periodDays: number = 30): { productId: number; quantitySold: number }[] => {
        const today = new Date();
        const endDate = new Date(today);
        const startDate = new Date(new Date().setDate(today.getDate() - periodDays)); // Corrected: Create new Date object before setDate
        
        const sales = this.getSalesByDateRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        const productSales = new Map<number, number>();
        sales.forEach(sale => {
          sale.items.forEach(item => {
            // Convert productId to number if it's a string
            const productIdNum = typeof item.productId === 'string' ? parseInt(item.productId) : item.productId;
            const currentTotal = productSales.get(productIdNum) || 0;
            productSales.set(productIdNum, currentTotal + item.quantity);
          });
        });

        return Array.from(productSales.entries())
          .map(([productId, quantitySold]) => ({ productId, quantitySold }))
          .sort((a, b) => b.quantitySold - a.quantitySold)
          .slice(0, count);
      };
    },

    profitLastNDays: (state) => function(days: number): number {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - days);

      // @ts-ignore
      const salesInPeriod = this.getSalesByDateRange(
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      // @ts-ignore
      return this.calculateProfitForSales(salesInPeriod);
    }
  },

  actions: {
    loadSales() {
      const storedSales = localStorage.getItem('sales');
      if (storedSales) {
        this.sales = JSON.parse(storedSales);
      }
    },
    async fetchSales() {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        // For now, using mock data
        this.sales = [
          {
            id: 1,
            date: '2024-03-15',
            items: [
              { productId: 1, productName: 'Coffee Beans - Arabica', quantity: 2, pricePerUnit: 15.99, total: 31.98 },
              { productId: 2, productName: 'Milk - Whole', quantity: 1, pricePerUnit: 4.99, total: 4.99 }
            ],
            subtotal: 36.97,
            discountAmount: 0,
            discountPercentage: 0,
            totalAmount: 36.97,
            paymentMethod: 'Credit Card',
            status: 'completed'
          },
          {
            id: 2,
            date: '2024-03-14',
            items: [
              { productId: 1, productName: 'Coffee Beans - Arabica', quantity: 1, pricePerUnit: 15.99, total: 15.99 },
              { productId: 3, productName: 'Sugar - White', quantity: 2, pricePerUnit: 2.99, total: 5.98 }
            ],
            subtotal: 21.97,
            discountAmount: 0,
            discountPercentage: 0,
            totalAmount: 21.97,
            paymentMethod: 'Cash',
            status: 'completed'
          }
        ];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch sales';
      } finally {
        this.loading = false;
      }
    },

    async addSale(sale: Omit<Sale, 'id'>) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        const newSale = {
          ...sale,
          id: Math.max(0, ...this.sales.map(s => typeof s.id === 'string' ? parseInt(s.id) : s.id)) + 1
        };
        this.sales.push(newSale);

        // Update product stock levels
        const productsStore = useProductsStore();
        for (const item of sale.items) {
          // Convert productId to number if it's a string
          const productIdNum = typeof item.productId === 'string' ? parseInt(item.productId) : item.productId;
          await productsStore.updateStock(productIdNum, -item.quantity);
        }

        return newSale;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add sale';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateSale(id: number | string, updates: Partial<Sale>) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        const index = this.sales.findIndex(s => s.id === id);
        if (index === -1) {
          throw new Error('Sale not found');
        }
        this.sales[index] = { ...this.sales[index], ...updates };
        return this.sales[index];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update sale';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteSale(id: number | string) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        const index = this.sales.findIndex(s => s.id === id);
        if (index === -1) {
          throw new Error('Sale not found');
        }
        this.sales.splice(index, 1);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete sale';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
}); 
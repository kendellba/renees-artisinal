import { defineStore } from 'pinia';
import { productsDB } from '../services/database';

export interface Product {
  id: number | string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  supplier: string;
  lastRestockDate: string;
  imageUrl?: string;
  // For compatibility with components using these properties
  isInventoryTracked?: boolean;
  currentStockLevel?: number | null;
  sellingPrice?: number;
  purchasePrice?: number;
}

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export const useProductsStore = defineStore('products', {
  state: (): ProductState => ({
    products: [],
    loading: false,
    error: null,
  }),

  getters: {
    getProductById: (state) => (id: number | string) => {
      return state.products.find(product => product.id === id);
    },
    
    getProductsByCategory: (state) => (category: string) => {
      return state.products.filter(product => product.category === category);
    },

    getLowStockProducts: (state) => {
      return state.products.filter(product => product.stock <= product.minStock);
    },

    getTotalProducts: (state) => {
      return state.products.length;
    },

    getTotalStockValue: (state) => {
      return state.products.reduce((total, product) => {
        return total + (product.stock * product.cost);
      }, 0);
    },
  },

  actions: {
    loadProducts() {
      // First try to load from localStorage for immediate display
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        this.products = JSON.parse(storedProducts);
      }
      
      // Then fetch from database for most up-to-date data
      this.fetchProducts();
    },
    
    async fetchProducts() {
      this.loading = true;
      this.error = null;
      try {
        const products = await productsDB.getAll();
        this.products = products;
        return products;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch products';
        // If we fail, try to load from localStorage
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
          this.products = JSON.parse(storedProducts);
        }
      } finally {
        this.loading = false;
      }
    },

    async addProduct(product: Omit<Product, 'id'>) {
      this.loading = true;
      this.error = null;
      try {
        const newProduct = await productsDB.add(product);
        this.products.push(newProduct as Product);
        return newProduct;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add product';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateProduct(id: number | string, updates: Partial<Product>) {
      this.loading = true;
      this.error = null;
      try {
        // Convert id to string for Firestore
        const stringId = id.toString();
        const updatedProduct = await productsDB.update(stringId, updates);
        
        // Update local state
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
          this.products[index] = { ...this.products[index], ...updates };
        }
        
        return updatedProduct;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update product';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteProduct(id: number | string) {
      this.loading = true;
      this.error = null;
      try {
        // Convert id to string for Firestore
        const stringId = id.toString();
        await productsDB.delete(stringId);
        
        // Update local state
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
          this.products.splice(index, 1);
        }
        
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete product';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateStock(id: number | string, quantity: number) {
      this.loading = true;
      this.error = null;
      try {
        const product = this.products.find(p => p.id === id);
        if (!product) {
          throw new Error('Product not found');
        }
        
        const newStock = product.stock + quantity;
        const updates = {
          stock: newStock,
          lastRestockDate: quantity > 0 ? new Date().toISOString().split('T')[0] : product.lastRestockDate
        };
        
        // Update in database
        const stringId = id.toString();
        await productsDB.update(stringId, updates);
        
        // Update local state
        product.stock = newStock;
        if (quantity > 0) {
          product.lastRestockDate = updates.lastRestockDate;
        }
        
        return product;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update stock';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // Sync local changes with the server
    async syncProducts() {
      try {
        await productsDB.syncWithServer();
        await this.fetchProducts(); // Refresh products after sync
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to sync products';
        return false;
      }
    }
  }
}); 
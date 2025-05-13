import { defineStore } from 'pinia';
import { useProductsStore, type Product } from './products';

// Define types for inventory items
export interface InventoryItem {
  id: string | number;
  productId: string | number;
  quantity: number;
  unitCost: number;
  location?: string;
  lastUpdated: string;
  expirationDate?: string;
  batchNumber?: string;
}

// Recipe/BOM system for prepared items
export interface IngredientItem {
  productId: string | number;
  quantity: number;
  optional: boolean;
}

export interface Recipe {
  id: string | number;
  productId: string | number;
  name: string;
  ingredients: IngredientItem[];
  preparationTime: number; // in minutes
  notes?: string;
}

// Waste tracking
export interface WasteRecord {
  id: string | number;
  productId: string | number;
  quantity: number;
  reason: 'expired' | 'damaged' | 'returned' | 'spoiled' | 'other';
  date: string;
  recordedBy?: string;
  notes?: string;
  costImpact: number;
}

// Reorder suggestion type
export interface ReorderSuggestion {
  productId: string | number;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  estimatedDaysUntilStockout: number;
  lastOrderDate?: string;
  averageDailyUsage: number;
}

interface InventoryState {
  inventoryItems: InventoryItem[];
  recipes: Recipe[];
  wasteRecords: WasteRecord[];
  lowStockThreshold: number;
  reorderPoints: Record<string | number, number>;
  preferredSuppliers: Record<string | number, string>;
  inventorySettings: {
    enableAutoReorderAlerts: boolean;
    wastageAlertThreshold: number; // Percentage of inventory
    expiringSoonDaysThreshold: number;
  };
  loading: boolean;
  error: string | null;
}

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryState => ({
    inventoryItems: [],
    recipes: [],
    wasteRecords: [],
    lowStockThreshold: 10,
    reorderPoints: {},
    preferredSuppliers: {},
    inventorySettings: {
      enableAutoReorderAlerts: true,
      wastageAlertThreshold: 5, // 5% wastage triggers alert
      expiringSoonDaysThreshold: 7 // 7 days is "expiring soon"
    },
    loading: false,
    error: null
  }),

  getters: {
    getProductInventory: (state) => (productId: string | number) => {
      return state.inventoryItems.find(item => item.productId === productId);
    },

    getProductRecipe: (state) => (productId: string | number) => {
      return state.recipes.find(recipe => recipe.productId === productId);
    },

    getWasteForProduct: (state) => (productId: string | number) => {
      return state.wasteRecords.filter(record => record.productId === productId);
    },

    getTotalWasteCost: (state) => {
      return state.wasteRecords.reduce((total, record) => total + record.costImpact, 0);
    },

    getTotalWasteByReason: (state) => {
      const wasteByReason: Record<string, { quantity: number, cost: number }> = {
        expired: { quantity: 0, cost: 0 },
        damaged: { quantity: 0, cost: 0 },
        returned: { quantity: 0, cost: 0 },
        spoiled: { quantity: 0, cost: 0 },
        other: { quantity: 0, cost: 0 }
      };

      state.wasteRecords.forEach(record => {
        wasteByReason[record.reason].quantity += record.quantity;
        wasteByReason[record.reason].cost += record.costImpact;
      });

      return wasteByReason;
    },

    getLowStockItems: (state) => {
      const productsStore = useProductsStore();
      return productsStore.products
        .filter(product => {
          const stockLevel = product.currentStockLevel ?? product.stock;
          const reorderPoint = state.reorderPoints[product.id] || state.lowStockThreshold;
          return stockLevel <= reorderPoint;
        })
        .map(product => ({
          id: product.id,
          name: product.name,
          currentStock: product.currentStockLevel ?? product.stock,
          reorderPoint: state.reorderPoints[product.id] || state.lowStockThreshold,
          supplier: state.preferredSuppliers[product.id] || product.supplier
        }));
    },

    // Identify items that have BOM/recipes that might not have enough ingredients
    getProductsWithInsufficientIngredients: (state) => {
      const productsStore = useProductsStore();
      const productsWithRecipes = state.recipes.map(recipe => {
        const product = productsStore.getProductById(recipe.productId);
        if (!product) return null;

        const insufficientIngredients = recipe.ingredients.filter(ingredient => {
          const ingredientProduct = productsStore.getProductById(ingredient.productId);
          if (!ingredientProduct) return false;
          
          const stockLevel = ingredientProduct.currentStockLevel ?? ingredientProduct.stock;
          return stockLevel < ingredient.quantity;
        });

        if (insufficientIngredients.length > 0) {
          return {
            productId: recipe.productId,
            name: product.name,
            missingIngredients: insufficientIngredients.map(ingredient => {
              const ingredientProduct = productsStore.getProductById(ingredient.productId);
              return {
                name: ingredientProduct?.name || 'Unknown',
                needed: ingredient.quantity,
                available: ingredientProduct?.currentStockLevel ?? ingredientProduct?.stock ?? 0
              };
            })
          };
        }
        return null;
      }).filter(Boolean);

      return productsWithRecipes;
    },

    // Get reorder suggestions based on stock levels, usage rates
    getReorderSuggestions: (state) => {
      const productsStore = useProductsStore();
      const suggestions: ReorderSuggestion[] = [];

      for (const product of productsStore.products) {
        const stockLevel = product.currentStockLevel ?? product.stock;
        const reorderPoint = state.reorderPoints[product.id] || state.lowStockThreshold;
        
        // Calculate average daily usage (simplified)
        const wasteForProduct = state.wasteRecords
          .filter(record => record.productId === product.id)
          .reduce((total, record) => total + record.quantity, 0);
          
        // Very simple calculation - 30 day lookback would be replaced with actual usage data
        const averageDailyUsage = (product.stock - stockLevel + wasteForProduct) / 30;
        
        if (stockLevel <= reorderPoint && averageDailyUsage > 0) {
          const daysUntilStockout = stockLevel / averageDailyUsage;
          const suggestedOrderQuantity = Math.ceil(averageDailyUsage * 30); // Order a month's supply
          
          suggestions.push({
            productId: product.id,
            currentStock: stockLevel,
            reorderPoint,
            suggestedOrderQuantity,
            estimatedDaysUntilStockout: Math.floor(daysUntilStockout),
            averageDailyUsage
          });
        }
      }
      
      // Sort by days until stockout (most urgent first)
      return suggestions.sort((a, b) => a.estimatedDaysUntilStockout - b.estimatedDaysUntilStockout);
    },

    // Items expiring soon
    getExpiringItems: (state) => {
      const today = new Date();
      const expirationThreshold = new Date();
      expirationThreshold.setDate(today.getDate() + state.inventorySettings.expiringSoonDaysThreshold);
      
      return state.inventoryItems
        .filter(item => {
          if (!item.expirationDate) return false;
          const expirationDate = new Date(item.expirationDate);
          return expirationDate <= expirationThreshold && expirationDate >= today;
        })
        .map(item => {
          const productsStore = useProductsStore();
          const product = productsStore.getProductById(item.productId);
          return {
            inventoryItemId: item.id,
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            expirationDate: item.expirationDate,
            quantity: item.quantity,
            daysUntilExpiration: Math.floor((new Date(item.expirationDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          };
        })
        .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
    }
  },

  actions: {
    // Data loading
    loadInventoryData() {
      const storedInventory = localStorage.getItem('inventory');
      const storedRecipes = localStorage.getItem('recipes');
      const storedWaste = localStorage.getItem('wasteRecords');
      const storedSettings = localStorage.getItem('inventorySettings');
      
      if (storedInventory) this.inventoryItems = JSON.parse(storedInventory);
      if (storedRecipes) this.recipes = JSON.parse(storedRecipes);
      if (storedWaste) this.wasteRecords = JSON.parse(storedWaste);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        this.inventorySettings = { ...this.inventorySettings, ...settings };
      }
    },
    
    saveInventoryData() {
      localStorage.setItem('inventory', JSON.stringify(this.inventoryItems));
      localStorage.setItem('recipes', JSON.stringify(this.recipes));
      localStorage.setItem('wasteRecords', JSON.stringify(this.wasteRecords));
      localStorage.setItem('inventorySettings', JSON.stringify(this.inventorySettings));
    },
    
    // Inventory operations
    async updateProductStock(productId: string | number, quantity: number, operation: 'add' | 'remove') {
      const productsStore = useProductsStore();
      const product = productsStore.getProductById(typeof productId === 'string' ? parseInt(productId) : productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (operation === 'remove' && (product.currentStockLevel || product.stock) < quantity) {
        throw new Error('Insufficient stock');
      }
      
      // Update the product stock
      await productsStore.updateStock(
        typeof productId === 'string' ? parseInt(productId) : productId, 
        operation === 'add' ? quantity : -quantity
      );
      
      // Update inventory item
      const inventoryItem = this.inventoryItems.find(item => item.productId === productId);
      if (inventoryItem) {
        inventoryItem.quantity = operation === 'add' 
          ? inventoryItem.quantity + quantity 
          : inventoryItem.quantity - quantity;
        inventoryItem.lastUpdated = new Date().toISOString();
      } else if (operation === 'add') {
        // New inventory item
        this.inventoryItems.push({
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          productId,
          quantity,
          unitCost: product.cost,
          lastUpdated: new Date().toISOString()
        });
      }
      
      this.saveInventoryData();
    },
    
    // Recipe management
    async addRecipe(recipe: Omit<Recipe, 'id'>) {
      const newRecipe: Recipe = {
        ...recipe,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
      };
      
      this.recipes.push(newRecipe);
      this.saveInventoryData();
      return newRecipe;
    },
    
    async updateRecipe(id: string | number, updates: Partial<Recipe>) {
      const index = this.recipes.findIndex(recipe => recipe.id === id);
      if (index === -1) throw new Error('Recipe not found');
      
      this.recipes[index] = { ...this.recipes[index], ...updates };
      this.saveInventoryData();
      return this.recipes[index];
    },
    
    async deleteRecipe(id: string | number) {
      const index = this.recipes.findIndex(recipe => recipe.id === id);
      if (index === -1) throw new Error('Recipe not found');
      
      this.recipes.splice(index, 1);
      this.saveInventoryData();
    },
    
    // Process prepared item (deduct ingredients)
    async processPreparedItem(productId: string | number, quantity: number = 1) {
      const recipe = this.getProductRecipe(productId);
      if (!recipe) throw new Error('No recipe found for this product');
      
      // Check if we have enough of each required ingredient
      const insufficientIngredients = recipe.ingredients
        .filter(ingredient => !ingredient.optional)
        .filter(ingredient => {
          const productsStore = useProductsStore();
          const ingredientProduct = productsStore.getProductById(
            typeof ingredient.productId === 'string' ? parseInt(ingredient.productId) : ingredient.productId
          );
          if (!ingredientProduct) return true; // Missing product is insufficient
          
          const stockLevel = ingredientProduct.currentStockLevel ?? ingredientProduct.stock;
          return stockLevel < ingredient.quantity * quantity;
        });
      
      if (insufficientIngredients.length > 0) {
        throw new Error(`Insufficient ingredients: ${insufficientIngredients.map(i => i.productId).join(', ')}`);
      }
      
      // Deduct all ingredients
      for (const ingredient of recipe.ingredients) {
        await this.updateProductStock(
          ingredient.productId, 
          ingredient.quantity * quantity, 
          'remove'
        );
      }
      
      // Produce the final product
      await this.updateProductStock(productId, quantity, 'add');
      return true;
    },
    
    // Waste tracking
    async recordWaste(wasteData: Omit<WasteRecord, 'id' | 'date' | 'costImpact'>) {
      // Verify the product exists and has sufficient stock
      const productsStore = useProductsStore();
      const product = productsStore.getProductById(
        typeof wasteData.productId === 'string' ? parseInt(wasteData.productId) : wasteData.productId
      );
      
      if (!product) throw new Error('Product not found');
      
      const stockLevel = product.currentStockLevel ?? product.stock;
      if (stockLevel < wasteData.quantity) {
        throw new Error('Cannot record waste greater than available stock');
      }
      
      // Calculate cost impact
      const costImpact = product.cost * wasteData.quantity;
      
      // Create waste record
      const wasteRecord: WasteRecord = {
        ...wasteData,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        date: new Date().toISOString(),
        costImpact
      };
      
      this.wasteRecords.push(wasteRecord);
      
      // Deduct from inventory
      await this.updateProductStock(wasteData.productId, wasteData.quantity, 'remove');
      
      this.saveInventoryData();
      return wasteRecord;
    },
    
    async setReorderPoint(productId: string | number, reorderPoint: number) {
      this.reorderPoints[productId] = reorderPoint;
      this.saveInventoryData();
    },
    
    async setPreferredSupplier(productId: string | number, supplier: string) {
      this.preferredSuppliers[productId] = supplier;
      this.saveInventoryData();
    },
    
    async updateInventorySettings(settings: Partial<InventoryState['inventorySettings']>) {
      this.inventorySettings = { ...this.inventorySettings, ...settings };
      this.saveInventoryData();
    }
  }
}); 
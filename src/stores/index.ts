import { createPinia } from 'pinia';
import { useProductsStore } from './products';
import { useSalesStore } from './sales';
import { usePurchasesStore } from './purchases';
import { useInventoryStore } from './inventory';
import { useInvoicesStore } from './invoices';
import { useCustomerStore } from './customers';
import { useSettingsStore } from './settings';

// Create the Pinia instance
const pinia = createPinia();

// Export the Pinia instance for use in main.ts
export default pinia;

// Helper function to ensure stores are only used after Pinia is initialized
export function initializeStores() {
  // This function will be called in App.vue after Pinia is initialized
  return {
    loadSales: () => {
      const salesStore = useSalesStore();
      salesStore.loadSales();
    },
    loadProducts: () => {
      const productStore = useProductsStore();
      productStore.loadProducts();
    },
    loadPurchases: () => {
      const purchasesStore = usePurchasesStore();
      purchasesStore.loadPurchases();
    },
    loadInventory: () => {
      const inventoryStore = useInventoryStore();
      inventoryStore.loadInventoryData();
    },
    loadSettings: () => {
      const settingsStore = useSettingsStore();
      settingsStore.loadSettings();
    },
    loadCustomers: () => {
      const customerStore = useCustomerStore();
      customerStore.loadCustomers();
    },
    loadInvoices: () => {
      const invoiceStore = useInvoicesStore();
      invoiceStore.loadInvoices();
    }
  };
}

export {
  useProductsStore,
  useSalesStore,
  usePurchasesStore,
  useInventoryStore,
  useInvoicesStore,
  useCustomerStore,
  useSettingsStore
}; 
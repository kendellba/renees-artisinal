<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, provide } from 'vue';
import { RouterView, useRouter, useRoute } from 'vue-router';
import { initializeStores } from '@/stores';
import { useProductsStore } from './stores/products';
import { useSalesStore } from './stores/sales';
import { useCustomerStore } from './stores/customers';
import { useInventoryStore } from './stores/inventory';
import { usePurchasesStore } from './stores/purchases';
import { useInvoicesStore } from './stores/invoices';
import { useSettingsStore } from './stores/settings';
import { auth, logoutUser } from './services/database';

// Network status tracking
const isOnline = ref(navigator.onLine);
const syncInProgress = ref(false);
const lastSyncTime = ref(localStorage.getItem('lastSyncTime') || 'Never');
const showSyncNotification = ref(false);

// Provide online status to all components
provide('isOnline', isOnline);

// Update online status when it changes
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
  
  // If coming back online, show sync option
  if (isOnline.value) {
    showSyncNotification.value = true;
  }
};

// Add/remove event listeners for online status
onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Create a test user if one doesn't exist (for development)
  if (!auth.currentUser && !localStorage.getItem('user')) {
    console.log('Creating test user for development');
    localStorage.setItem('user', JSON.stringify({
      email: 'test@example.com',
      displayName: 'Test User',
      uid: 'test-user-id'
    }));
  }
  
  // Initialize stores
  const productsStore = useProductsStore();
  const salesStore = useSalesStore();
  const customerStore = useCustomerStore();
  const inventoryStore = useInventoryStore();
  const purchasesStore = usePurchasesStore();
  const invoicesStore = useInvoicesStore();
  const settingsStore = useSettingsStore();
  
  productsStore.loadProducts();
  salesStore.loadSales();
  customerStore.loadCustomers();
  inventoryStore.loadInventoryData();
  purchasesStore.loadPurchases();
  invoicesStore.loadInvoices();
  settingsStore.loadSettings();
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});

// Sync all stores with server
const syncData = async () => {
  if (!isOnline.value || syncInProgress.value) return;
  
  try {
    syncInProgress.value = true;
    
    // Sync from database service - first get instance of stores
    const productsStore = useProductsStore();
    const salesStore = useSalesStore();
    const customerStore = useCustomerStore();
    const inventoryStore = useInventoryStore();
    const purchasesStore = usePurchasesStore();
    const invoicesStore = useInvoicesStore();
    const settingsStore = useSettingsStore();
    
    // Refetch data from Firebase
    await productsStore.fetchProducts();
    
    // If we implemented sync in other stores, would call them here
    // For now, just reload them
    await salesStore.loadSales();
    await customerStore.loadCustomers();
    await inventoryStore.loadInventoryData();
    await purchasesStore.loadPurchases();
    await invoicesStore.loadInvoices();
    await settingsStore.loadSettings();
    
    // Update last sync time
    const now = new Date().toLocaleString();
    lastSyncTime.value = now;
    localStorage.setItem('lastSyncTime', now);
    
    // Show success message
    showSnackbar('Data synchronized successfully!', 'success');
  } catch (error) {
    console.error('Sync error:', error);
    showSnackbar('Sync failed. Please try again.', 'error');
  } finally {
    syncInProgress.value = false;
    showSyncNotification.value = false;
  }
};

// Handle logout
const router = useRouter();
const route = useRoute();

const logout = async () => {
  try {
    // Sync data before logging out
    if (isOnline.value) {
      await syncData();
    }
    
    // Clear local storage (except cached data)
    localStorage.removeItem('user');
    
    // Firebase logout
    await logoutUser();
    
    // Redirect to login
    if (route.path !== '/login') {
      router.push('/login');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showSnackbar('Error logging out.', 'error');
  }
};

// Snackbar state
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000
});

const showSnackbar = (message: string, color = 'success', timeout = 3000) => {
  snackbar.value = {
    show: true,
    message,
    color,
    timeout
  };
};

// For the drawer menu
const drawer = ref(true);
const toggleDrawer = () => {
  drawer.value = !drawer.value;
};

// Check if user is authenticated for the menu display
const isAuthenticated = computed(() => {
  return auth.currentUser || localStorage.getItem('user');
});

// Navigation menu items
const menuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/' },
  { title: 'Products', icon: 'mdi-package-variant-closed', to: '/products' },
  { title: 'Product Builder', icon: 'mdi-shape-plus', to: '/product-builder' },
  { title: 'Sales', icon: 'mdi-cart', to: '/sales' },
  { title: 'Purchases', icon: 'mdi-currency-usd', to: '/purchases' },
  { title: 'Inventory', icon: 'mdi-store', to: '/inventory' },
  { title: 'Invoices', icon: 'mdi-file-document', to: '/invoices' },
  { title: 'Reports', icon: 'mdi-chart-bar', to: '/reports' },
  { title: 'Settings', icon: 'mdi-cog', to: '/settings' }
];
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" v-if="isAuthenticated">
      <v-list>
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" to="/" class="mb-2" />
        <v-divider class="my-2"></v-divider>
        <v-list-item prepend-icon="mdi-cart" title="Sales" to="/sales" />
        <v-list-item prepend-icon="mdi-shopping" title="Products" to="/products" />
        <v-list-item prepend-icon="mdi-shape-plus" title="Product Builder" to="/product-builder" />
        <v-list-item prepend-icon="mdi-currency-usd" title="Purchases" to="/purchases" />
        <v-list-item prepend-icon="mdi-archive" title="Inventory" to="/inventory" />
        <v-list-item prepend-icon="mdi-file-document" title="Invoices" to="/invoices" />
        <v-divider class="my-2"></v-divider>
        <v-list-item prepend-icon="mdi-cog" title="Settings" to="/settings" />
        <v-list-item prepend-icon="mdi-logout" title="Logout" @click="logout" />
      </v-list>
      
      <!-- Offline/Online indicator -->
      <template v-slot:append>
        <div class="pa-2">
          <v-chip
            :color="isOnline ? 'success' : 'error'"
            variant="outlined"
            size="small"
            class="text-caption"
          >
            <v-icon
              :icon="isOnline ? 'mdi-wifi' : 'mdi-wifi-off'"
              size="small"
              start
            ></v-icon>
            {{ isOnline ? 'Online' : 'Offline' }}
          </v-chip>
          
          <div class="text-caption mt-1">
            Last Sync: {{ lastSyncTime }}
          </div>
          
          <v-btn
            v-if="isOnline"
            block
            size="small"
            variant="tonal"
            color="primary"
            class="mt-2"
            prepend-icon="mdi-sync"
            :disabled="syncInProgress"
            :loading="syncInProgress"
            @click="syncData"
          >
            Sync Data
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar v-if="isAuthenticated">
      <v-app-bar-nav-icon @click="toggleDrawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Renee's Artisinal Café</v-toolbar-title>
    </v-app-bar>

    <v-main style="min-height: 100vh;">
      <Transition name="fade" mode="out-in">
        <RouterView />
      </Transition>
    </v-main>
    
    <!-- Sync Notification -->
    <v-snackbar
      v-model="showSyncNotification"
      color="info"
      timeout="-1"
    >
      You're back online! Would you like to sync your data?
      
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="showSyncNotification = false"
        >
          Dismiss
        </v-btn>
        <v-btn
          variant="text"
          @click="syncData"
          :loading="syncInProgress"
        >
          Sync Now
        </v-btn>
      </template>
    </v-snackbar>
    
    <!-- General Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
      
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style>
/* Global styles */
html {
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

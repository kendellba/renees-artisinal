<template>
  <div class="settings-view">
    <v-container>
      <h1 class="text-h4 mb-4">Settings</h1>
      
      <v-tabs v-model="activeTab">
        <v-tab value="business">Business Information</v-tab>
        <v-tab value="receipt">Receipt Settings</v-tab>
        <v-tab value="general">General Settings</v-tab>
      </v-tabs>
      
      <v-window v-model="activeTab" class="mt-4">
        <!-- Business Information Tab -->
        <v-window-item value="business">
          <v-card>
            <v-card-text>
              <v-form @submit.prevent="saveBusinessSettings">
                <v-text-field
                  v-model="businessSettings.name"
                  label="Business Name"
                  variant="outlined"
                  required
                ></v-text-field>
                
                <v-text-field
                  v-model="businessSettings.address"
                  label="Business Address"
                  variant="outlined"
                ></v-text-field>
                
                <v-text-field
                  v-model="businessSettings.phone"
                  label="Business Phone"
                  variant="outlined"
                ></v-text-field>
                
                <v-text-field
                  v-model="businessSettings.email"
                  label="Business Email"
                  type="email"
                  variant="outlined"
                ></v-text-field>
                
                <v-text-field
                  v-model="businessSettings.website"
                  label="Business Website"
                  variant="outlined"
                ></v-text-field>
                
                <v-text-field
                  v-model="businessSettings.taxRate"
                  label="Default Tax Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  hint="Enter as decimal (e.g., 7.5 for 7.5%)"
                  variant="outlined"
                ></v-text-field>
                
                <v-text-field
                  v-model="businessSettings.receiptTagline"
                  label="Receipt Tagline"
                  variant="outlined"
                  hint="Message to display at the bottom of receipts"
                ></v-text-field>
                
                <v-file-input
                  v-model="logoFile"
                  label="Business Logo"
                  hint="Upload a logo to display on receipts"
                  variant="outlined"
                  accept="image/*"
                  @update:model-value="handleLogoUpload"
                ></v-file-input>
                
                <div v-if="businessSettings.logo" class="mt-2 mb-4">
                  <p class="mb-1">Current Logo:</p>
                  <v-img
                    :src="businessSettings.logo"
                    max-width="200"
                    max-height="100"
                    contain
                  ></v-img>
                  <v-btn
                    size="small"
                    variant="text"
                    color="error"
                    class="mt-1"
                    @click="removeLogo"
                  >
                    Remove Logo
                  </v-btn>
                </div>
                
                <v-btn
                  type="submit"
                  color="primary"
                  class="mt-4"
                >
                  Save Business Information
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-window-item>
        
        <!-- Receipt Settings Tab -->
        <v-window-item value="receipt">
          <v-card>
            <v-card-text>
              <h2 class="text-h6 mb-3">Receipt Customization</h2>
              
              <v-switch
                v-model="receiptSettings.showLogo"
                label="Show logo on receipts"
                color="primary"
                hide-details
                class="mb-2"
              ></v-switch>
              
              <v-switch
                v-model="receiptSettings.showBarcode"
                label="Show barcode/order number on receipts"
                color="primary"
                hide-details
                class="mb-2"
              ></v-switch>
              
              <v-switch
                v-model="receiptSettings.printAutomatically"
                label="Print receipts automatically after sale"
                color="primary"
                hide-details
                class="mb-4"
              ></v-switch>
              
              <h3 class="text-subtitle-1 mt-4 mb-2">Digital Receipts</h3>
              
              <v-switch
                v-model="receiptSettings.enableEmailReceipts"
                label="Enable email receipts"
                color="primary"
                hide-details
                class="mb-2"
              ></v-switch>
              
              <v-switch
                v-model="receiptSettings.enableSmsReceipts"
                label="Enable SMS receipts"
                color="primary"
                hide-details
                class="mb-4"
              ></v-switch>
              
              <v-textarea
                v-model="receiptSettings.defaultMessage"
                label="Default Receipt Message"
                variant="outlined"
                hint="Custom message to print on all receipts"
                rows="3"
                class="mt-2"
              ></v-textarea>
              
              <div class="mt-5">
                <h3 class="text-subtitle-1 mb-3">Receipt Preview</h3>
                <v-card variant="outlined" max-width="350" class="mx-auto">
                  <v-card-text>
                    <Receipt
                      :sale="sampleSale"
                      :customer="sampleCustomer"
                      :loyaltyPointsEarned="50"
                      :customMessage="receiptSettings.defaultMessage"
                      :showBarcode="receiptSettings.showBarcode"
                      printMode
                    />
                  </v-card-text>
                </v-card>
              </div>
              
              <v-btn
                color="primary"
                class="mt-4"
                @click="saveReceiptSettings"
              >
                Save Receipt Settings
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>
        
        <!-- General Settings Tab -->
        <v-window-item value="general">
          <v-card>
            <v-card-text>
              <h2 class="text-h6 mb-3">Display Settings</h2>
              
              <v-select
                v-model="generalSettings.theme"
                label="Theme"
                :items="themeOptions"
                variant="outlined"
                class="mb-3"
              ></v-select>
              
              <v-select
                v-model="generalSettings.language"
                label="Language"
                :items="languageOptions"
                variant="outlined"
              ></v-select>
              
              <v-btn
                color="primary"
                class="mt-4"
                @click="saveGeneralSettings"
              >
                Save General Settings
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
      
      <v-card class="mb-4">
        <v-card-title class="d-flex align-center">
          <span>Database Synchronization</span>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :loading="isSyncing"
            @click="syncAllCollections"
            prepend-icon="mdi-database-sync"
          >
            Sync All Tables to Firestore
          </v-btn>
        </v-card-title>
        <v-card-text>
          <p class="mb-4">Sync status for each collection:</p>
          
          <v-list lines="two">
            <v-list-item v-for="(value, key) in syncStatus" :key="key">
              <template v-slot:prepend>
                <v-icon :color="getStatusColor(value.status)" :icon="getStatusIcon(value.status)"></v-icon>
              </template>
              <v-list-item-title class="text-capitalize">{{ key }}</v-list-item-title>
              <v-list-item-subtitle>
                Status: {{ value.status || 'Not synced' }}
                <span v-if="value.error" class="text-error">- {{ value.error }}</span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
      
      <v-card class="mb-4">
        <v-card-title class="d-flex align-center">
          <span>Database Seeding</span>
        </v-card-title>
        <v-card-text>
          <p class="mb-4">Populate your Firestore database with sample data for testing:</p>
          
          <v-row>
            <v-col cols="12" sm="6" md="4" lg="3">
              <v-btn
                block
                color="warning"
                :loading="isSeeding"
                @click="seedEntireDatabase"
                prepend-icon="mdi-database-plus"
              >
                Seed All Collections
              </v-btn>
            </v-col>
            
            <v-col cols="12" sm="6" md="4" lg="3">
              <v-select
                v-model="selectedCollection"
                :items="collections"
                label="Select Collection"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
            
            <v-col cols="12" sm="6" md="4" lg="3">
              <v-btn
                block
                color="warning"
                :loading="isSeeding"
                :disabled="!selectedCollection"
                @click="seedSelectedCollection"
                prepend-icon="mdi-database-plus"
              >
                Seed Selected Collection
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      
      <v-snackbar
        v-model="showSnackbar"
        :color="snackbarColor"
        timeout="3000"
      >
        {{ snackbarText }}
      </v-snackbar>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useSettingsStore, type BusinessSettings } from '../stores/settings';
import Receipt from '../components/pos/Receipt.vue';
import { 
  productsDB, 
  salesDB, 
  purchasesDB, 
  customersDB, 
  inventoryDB, 
  invoicesDB, 
  settingsDB 
} from '../services/database';
import { seedDatabase, seedCollection2 } from '../utilities/firestore-seeder';

// Sample data for receipt preview
import { type Sale } from '../stores/sales';
import { type Customer } from '../stores/customers';

const settingsStore = useSettingsStore();
const activeTab = ref('business');

// Business settings form
const businessSettings = reactive<BusinessSettings>({
  name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxRate: 0,
  receiptTagline: '',
  logo: undefined
});

// Receipt settings form
const receiptSettings = reactive({
  showLogo: true,
  showBarcode: true,
  enableEmailReceipts: true,
  enableSmsReceipts: true,
  defaultMessage: '',
  printAutomatically: false
});

// General settings form
const generalSettings = reactive({
  theme: 'system',
  language: 'en'
});

// Options for select inputs
const themeOptions = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
  { title: 'System Default', value: 'system' }
];

const languageOptions = [
  { title: 'English', value: 'en' },
  { title: 'Spanish', value: 'es' },
  { title: 'French', value: 'fr' }
];

// Snackbar state
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const logoFile = ref<File | null>(null);

// Sample data for receipt preview
const sampleSale: Sale = {
  id: 1001,
  date: new Date().toISOString(),
  items: [
    { productId: 1, productName: 'Coffee - Latte', quantity: 1, pricePerUnit: 4.50, total: 4.50, notes: 'Extra shot' },
    { productId: 2, productName: 'Blueberry Muffin', quantity: 2, pricePerUnit: 3.25, total: 6.50 }
  ],
  subtotal: 11.00,
  tax: 0.77,
  discountAmount: 0,
  discountPercentage: 0,
  totalAmount: 11.77,
  paymentMethod: 'Credit Card',
  status: 'completed',
  payments: [
    { method: 'Credit Card', amount: 11.77 }
  ]
};

const sampleCustomer: Customer = {
  id: 123,
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '(555) 123-4567',
  loyaltyPoints: 520,
  loyaltyTier: 'silver',
  joinDate: '2023-05-15',
  totalSpent: 750.25
};

// Sync state
const isSyncing = ref(false);
const syncStatus = ref({
  products: { status: '', error: '' },
  sales: { status: '', error: '' },
  purchases: { status: '', error: '' },
  customers: { status: '', error: '' },
  inventory: { status: '', error: '' },
  invoices: { status: '', error: '' },
  settings: { status: '', error: '' }
});

// Seeding state
const isSeeding = ref(false);
const selectedCollection = ref('');
const collections = [
  'products',
  'customers',
  'sales',
  'purchases',
  'invoices',
  'settings'
];

type CollectionName = 'products' | 'sales' | 'purchases' | 'customers' | 'inventory' | 'invoices' | 'settings';
type DatabaseService = {
  syncWithServer: () => Promise<void>;
};

// Function to sync a single collection
const syncCollection = async (dbService: DatabaseService, name: string) => {
  const collectionKey = name.toLowerCase() as CollectionName;
  syncStatus.value[collectionKey].status = 'syncing';
  try {
    await dbService.syncWithServer();
    syncStatus.value[collectionKey].status = 'success';
  } catch (error: any) {
    syncStatus.value[collectionKey].status = 'error';
    syncStatus.value[collectionKey].error = error.message || 'Unknown error';
    console.error(`Error syncing ${name}:`, error);
  }
};

// Function to sync all collections
const syncAllCollections = async () => {
  isSyncing.value = true;
  
  try {
    // Reset status
    Object.keys(syncStatus.value).forEach(key => {
      syncStatus.value[key] = { status: 'pending', error: '' };
    });
    
    // Sync collections in parallel
    await Promise.all([
      syncCollection(productsDB, 'Products'),
      syncCollection(salesDB, 'Sales'),
      syncCollection(purchasesDB, 'Purchases'),
      syncCollection(customersDB, 'Customers'),
      syncCollection(inventoryDB, 'Inventory'),
      syncCollection(invoicesDB, 'Invoices'),
      syncCollection(settingsDB, 'Settings')
    ]);
    
  } catch (error) {
    console.error('Error during sync:', error);
  } finally {
    isSyncing.value = false;
  }
};

// Load settings from store
onMounted(() => {
  // Load business settings
  Object.assign(businessSettings, settingsStore.business);
  
  // Load receipt settings
  Object.assign(receiptSettings, settingsStore.receiptSettings);
  
  // Load general settings
  generalSettings.theme = settingsStore.theme;
  generalSettings.language = settingsStore.language;
});

// Methods
const saveBusinessSettings = () => {
  settingsStore.updateBusinessSettings(businessSettings);
  showSnackbarMessage('Business information saved successfully', 'success');
};

const saveReceiptSettings = () => {
  settingsStore.updateReceiptSettings(receiptSettings);
  showSnackbarMessage('Receipt settings saved successfully', 'success');
};

const saveGeneralSettings = () => {
  settingsStore.updateTheme(generalSettings.theme as 'light' | 'dark' | 'system');
  settingsStore.updateLanguage(generalSettings.language);
  showSnackbarMessage('General settings saved successfully', 'success');
};

const handleLogoUpload = (event: Event | File[] | File | null) => {
  // If it's a FileList, Event, or array, extract the file
  let file: File | null = null;
  
  if (event instanceof Event && event.target) {
    // Handle Event object from @change (old Vue 2 style)
    const target = event.target as HTMLInputElement;
    file = target.files?.[0] || null;
  } else if (Array.isArray(event)) {
    // Handle array of files (sometimes v-file-input returns this)
    file = event[0] || null;
  } else if (event instanceof File) {
    // If it's already a file object
    file = event;
  } else if (event === null) {
    // If the input was cleared
    businessSettings.logo = undefined;
    return;
  }
  
  if (!file) return;
  
  // Convert image to base64 for storage
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && typeof e.target.result === 'string') {
      businessSettings.logo = e.target.result;
    }
  };
  reader.readAsDataURL(file);
};

const removeLogo = () => {
  businessSettings.logo = undefined;
};

const showSnackbarMessage = (message: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = message;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// Helper methods to determine icon and color based on status
const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'success': return 'mdi-check-circle';
    case 'error': return 'mdi-alert-circle';
    case 'syncing': return 'mdi-sync';
    default: return 'mdi-circle-outline';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success': return 'success';
    case 'error': return 'error';
    case 'syncing': return 'info';
    default: return 'grey';
  }
};

// Seeding methods
const seedEntireDatabase = async () => {
  isSeeding.value = true;
  try {
    await seedDatabase();
    showSnackbar('Database seeded successfully with sample data!', 'success');
  } catch (error: any) {
    showSnackbar(`Error seeding database: ${error.message}`, 'error');
  } finally {
    isSeeding.value = false;
  }
};

const seedSelectedCollection = async () => {
  if (!selectedCollection.value) return;
  
  isSeeding.value = true;
  try {
    await seedCollection2(selectedCollection.value);
    showSnackbar(`${selectedCollection.value} collection seeded successfully!`, 'success');
  } catch (error: any) {
    showSnackbar(`Error seeding collection: ${error.message}`, 'error');
  } finally {
    isSeeding.value = false;
  }
};
</script>

<style scoped>
.settings-view {
  padding: 24px;
}
</style> 
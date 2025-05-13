<template>
  <div class="customer-loyalty-panel">
    <v-card class="mb-3">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Customer</span>
        <div>
          <v-chip v-if="selectedCustomer" color="primary" class="mr-2">
            <template v-slot:prepend>
              <v-icon icon="mdi-account"></v-icon>
            </template>
            {{ selectedCustomer.name }}
          </v-chip>
          <v-chip v-if="selectedCustomer && selectedCustomer.loyaltyTier !== 'none'" :color="getLoyaltyTierColor(selectedCustomer.loyaltyTier)">
            <template v-slot:prepend>
              <v-icon v-if="selectedCustomer.loyaltyTier === 'platinum'" icon="mdi-crown"></v-icon>
              <v-icon v-else-if="selectedCustomer.loyaltyTier === 'gold'" icon="mdi-star"></v-icon>
              <v-icon v-else icon="mdi-card-account-details"></v-icon>
            </template>
            {{ selectedCustomer.loyaltyTier.charAt(0).toUpperCase() + selectedCustomer.loyaltyTier.slice(1) }}
          </v-chip>
        </div>
      </v-card-title>

      <v-card-text>
        <div v-if="!selectedCustomer">
          <v-text-field
            v-model="searchQuery"
            label="Search by name, email, or phone"
            variant="outlined"
            hide-details
            density="compact"
            placeholder="Search customers..."
            clearable
            @update:model-value="searchCustomers"
            class="mb-3"
          >
            <template v-slot:append>
              <v-icon icon="mdi-magnify"></v-icon>
            </template>
          </v-text-field>

          <v-list v-if="searchResults.length > 0" density="compact" class="search-results-list">
            <v-list-item
              v-for="customer in searchResults"
              :key="customer.id"
              @click="selectCustomer(customer)"
              class="customer-list-item"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" size="small">
                  <v-icon icon="mdi-account"></v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ customer.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ customer.email }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          
          <div v-else-if="searchQuery && !loading" class="text-center py-3">
            No customers found 
            <v-btn size="small" variant="text" color="primary" @click="showNewCustomerDialog = true">
              Create New
            </v-btn>
          </div>
          
          <div v-if="!searchQuery" class="d-flex justify-space-between align-center mt-2">
            <span>No customer selected</span>
            <v-btn 
              size="small" 
              color="primary" 
              variant="text" 
              @click="showNewCustomerDialog = true"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-account-plus"></v-icon>
              </template>
              New Customer
            </v-btn>
          </div>
        </div>

        <div v-else>
          <div class="d-flex mb-3 align-center">
            <div>
              <div class="text-subtitle-1">{{ selectedCustomer.name }}</div>
              <div class="text-caption text-medium-emphasis mb-1">{{ selectedCustomer.email }}</div>
              <div class="text-caption text-medium-emphasis" v-if="selectedCustomer.phone">{{ selectedCustomer.phone }}</div>
            </div>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" size="small" variant="text" @click="clearSelectedCustomer"></v-btn>
          </div>

          <div v-if="selectedCustomer.loyaltyTier !== 'none'" class="loyalty-details bg-grey-lighten-4 rounded pa-3 mb-3">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-2">Loyalty Points</span>
              <span class="font-weight-bold">{{ selectedCustomer.loyaltyPoints }}</span>
            </div>

            <div v-if="isBirthdayMonth" class="birthday-alert d-flex align-center pa-2 rounded mb-2 bg-purple-lighten-5">
              <v-icon icon="mdi-cake-variant" class="mr-2" color="purple"></v-icon>
              <span class="text-body-2">Birthday Month! Special {{ birthdayDiscount }} points bonus applied</span>
            </div>

            <div class="text-caption">
              <span class="font-weight-bold">{{ tierInfo.discountPercentage }}%</span> discount available
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <v-icon icon="mdi-information-outline" size="small" v-bind="props"></v-icon>
                </template>
                <div class="pa-2">
                  <div>{{ selectedCustomer.loyaltyTier }} tier benefits:</div>
                  <div>• {{ tierInfo.discountPercentage }}% discount on purchases</div>
                  <div>• {{ tierInfo.pointsMultiplier }}x points multiplier</div>
                  <div>• {{ tierInfo.birthdayBonus }} bonus points on birthday month</div>
                </div>
              </v-tooltip>
            </div>

            <div class="d-flex justify-space-between align-center mt-3">
              <v-btn 
                size="small" 
                color="success" 
                :disabled="!canRedeemDiscount"
                @click="applyLoyaltyDiscount"
              >
                Apply {{ tierInfo.discountPercentage }}% Discount
              </v-btn>
              
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn 
                    size="small" 
                    variant="outlined" 
                    v-bind="props"
                    :disabled="selectedCustomer.loyaltyPoints < 100"
                  >
                    Redeem Points
                  </v-btn>
                </template>
                <v-card width="250">
                  <v-card-title class="text-subtitle-1">Redeem Points</v-card-title>
                  <v-card-text>
                    <v-text-field
                      v-model.number="pointsToRedeem"
                      type="number"
                      :min="100"
                      :max="selectedCustomer.loyaltyPoints"
                      :rules="[
                        value => !!value || 'Required',
                        value => value >= 100 || 'Minimum 100 points',
                        value => value <= selectedCustomer.loyaltyPoints || 'Exceeds available points'
                      ]"
                      label="Points"
                      density="compact"
                    ></v-text-field>
                    <div class="text-caption">100 points = $1 discount</div>
                    <div class="text-body-2 mt-2">
                      Discount Value: {{ formatCurrency(pointsToRedeem ? pointsToRedeem / 100 : 0) }}
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn 
                      variant="text" 
                      @click="pointsToRedeem = 0"
                    >
                      Cancel
                    </v-btn>
                    <v-btn 
                      color="primary" 
                      @click="redeemPointsForDiscount"
                      :disabled="!pointsToRedeem || pointsToRedeem < 100"
                    >
                      Apply
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- New Customer Dialog -->
    <v-dialog v-model="showNewCustomerDialog" max-width="500px">
      <v-card>
        <v-card-title>Add New Customer</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="isFormValid">
            <v-text-field
              v-model="newCustomer.name"
              label="Name"
              required
              :rules="[v => !!v || 'Name is required']"
              class="mb-2"
            ></v-text-field>
            
            <v-text-field
              v-model="newCustomer.email"
              label="Email"
              required
              :rules="[
                v => !!v || 'Email is required',
                v => /.+@.+\..+/.test(v) || 'Email must be valid'
              ]"
              class="mb-2"
            ></v-text-field>
            
            <v-text-field
              v-model="newCustomer.phone"
              label="Phone"
              class="mb-2"
            ></v-text-field>
            
            <v-text-field
              v-model="newCustomer.address"
              label="Address"
              class="mb-2"
            ></v-text-field>
            
            <v-text-field
              v-model="newCustomer.birthDate"
              label="Birth Date"
              type="date"
              class="mb-2"
            ></v-text-field>
            
            <v-textarea
              v-model="newCustomer.notes"
              label="Notes"
              rows="2"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showNewCustomerDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="createNewCustomer"
            :disabled="!isFormValid"
            :loading="loading"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCustomerStore, type Customer, type LoyaltyTier } from '../../stores/customers';

const customerStore = useCustomerStore();
const emit = defineEmits(['update:customer', 'apply-discount']);

// State
const searchQuery = ref('');
const searchResults = ref<Customer[]>([]);
const selectedCustomer = ref<Customer | null>(null);
const showNewCustomerDialog = ref(false);
const loading = ref(false);
const pointsToRedeem = ref<number>(0);
const isFormValid = ref(false);
const form = ref(null);
const loyaltyDiscountApplied = ref(false);

// New customer form data
const newCustomer = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  notes: ''
});

// Computed properties
const tierInfo = computed<LoyaltyTier>(() => {
  if (!selectedCustomer.value) return customerStore.getTierByName('none');
  return customerStore.getTierByName(selectedCustomer.value.loyaltyTier);
});

const canRedeemDiscount = computed(() => {
  return selectedCustomer.value && 
    selectedCustomer.value.loyaltyTier !== 'none' && 
    !loyaltyDiscountApplied.value;
});

const isBirthdayMonth = computed(() => {
  if (!selectedCustomer.value) return false;
  return customerStore.isBirthdayMonth(selectedCustomer.value);
});

const birthdayDiscount = computed(() => {
  if (!selectedCustomer.value) return 0;
  return customerStore.getBirthdayDiscount(selectedCustomer.value.id);
});

// Methods
const searchCustomers = () => {
  if (!searchQuery.value) {
    searchResults.value = [];
    return;
  }
  
  searchResults.value = customerStore.searchCustomers(searchQuery.value);
};

const selectCustomer = (customer: Customer) => {
  selectedCustomer.value = customer;
  searchQuery.value = '';
  searchResults.value = [];
  loyaltyDiscountApplied.value = false;
  emit('update:customer', customer);
};

const clearSelectedCustomer = () => {
  selectedCustomer.value = null;
  loyaltyDiscountApplied.value = false;
  emit('update:customer', null);
};

const createNewCustomer = async () => {
  try {
    loading.value = true;
    const customer = await customerStore.addCustomer({
      name: newCustomer.value.name,
      email: newCustomer.value.email,
      phone: newCustomer.value.phone,
      address: newCustomer.value.address,
      birthDate: newCustomer.value.birthDate,
      notes: newCustomer.value.notes
    });
    
    selectCustomer(customer);
    showNewCustomerDialog.value = false;
    resetNewCustomerForm();
  } catch (error) {
    console.error('Failed to create customer', error);
  } finally {
    loading.value = false;
  }
};

const resetNewCustomerForm = () => {
  newCustomer.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    notes: ''
  };
  
  if (form.value) {
    // @ts-ignore
    form.value.reset();
  }
};

const applyLoyaltyDiscount = () => {
  if (!selectedCustomer.value) return;
  
  const discountPercent = tierInfo.value.discountPercentage;
  emit('apply-discount', { type: 'percentage', value: discountPercent, source: 'loyalty' });
  loyaltyDiscountApplied.value = true;
};

const redeemPointsForDiscount = () => {
  if (!selectedCustomer.value || !pointsToRedeem.value) return;
  
  const discountAmount = pointsToRedeem.value / 100; // 100 points = $1
  
  customerStore.redeemPoints(selectedCustomer.value.id, pointsToRedeem.value);
  emit('apply-discount', { type: 'fixed', value: discountAmount, source: 'points' });
  
  // Update the selected customer with the new points balance
  selectedCustomer.value = customerStore.getCustomerById(selectedCustomer.value.id) as Customer;
  pointsToRedeem.value = 0;
};

const getLoyaltyTierColor = (tier: string): string => {
  switch (tier) {
    case 'platinum': return 'purple';
    case 'gold': return 'amber';
    case 'silver': return 'grey';
    case 'bronze': return 'brown';
    default: return 'grey-lighten-1';
  }
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Initialize
onMounted(() => {
  customerStore.loadCustomers();
  if (customerStore.customers.length === 0) {
    customerStore.fetchCustomers();
  }
});
</script>

<style scoped>
.customer-loyalty-panel {
  max-width: 100%;
}

.search-results-list {
  max-height: 200px;
  overflow-y: auto;
}

.customer-list-item {
  cursor: pointer;
}

.customer-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.loyalty-details {
  border-left: 4px solid var(--v-primary-base);
}

.birthday-alert {
  border-left: 3px solid purple;
}
</style> 
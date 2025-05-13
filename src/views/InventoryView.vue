<template>
  <div class="inventory-management pa-4">
    <h1 class="text-h4 mb-4">Inventory Management</h1>

    <v-card class="mb-4">
      <v-card-actions>
        <v-btn color="purple" prepend-icon="mdi-pencil" @click="openStockAdjustmentDialog(null)">
          Manual Stock Adjustment
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="filters.global.value"
          prepend-inner-icon="mdi-magnify"
          label="Search Inventory..."
          density="compact"
          hide-details
          class="search-field"
        ></v-text-field>
      </v-card-actions>
    </v-card>

    <v-card>
      <v-data-table
        :items="inventoryItems"
        :items-per-page="10"
        :headers="headers"
        :search="filters.global.value"
        class="elevation-1"
      >
        <template v-slot:item.name="{ item }">
          {{ item.raw.name }}
          <v-chip
            v-if="isLowStock(item.raw)"
            color="warning"
            size="small"
            class="ml-2"
          >
            Low Stock
          </v-chip>
        </template>

        <template v-slot:item.currentStockLevel="{ item }">
          <span :class="{
            'text-red': item.raw.currentStockLevel === 0,
            'text-orange': item.raw.currentStockLevel > 0 && item.raw.currentStockLevel < inventoryStore.lowStockThreshold
          }">
            {{ item.raw.currentStockLevel }}
          </span>
        </template>

        <template v-slot:item.purchasePrice="{ item }">
          {{ formatCurrency(item.raw.purchasePrice) }}
        </template>

        <template v-slot:item.sellingPrice="{ item }">
          {{ formatCurrency(item.raw.sellingPrice) }}
        </template>

        <template v-slot:item.stockValue="{ item }">
          {{ formatCurrency(item.raw.currentStockLevel * item.raw.purchasePrice) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            color="info"
            variant="text"
            size="small"
            @click="openStockAdjustmentDialog(item.raw)"
          ></v-btn>
        </template>

        <template v-slot:no-data>
          No inventory-tracked items found.
        </template>
      </v-data-table>
    </v-card>

    <!-- Stock Adjustment Dialog -->
    <v-dialog v-model="stockAdjustmentDialogVisible" max-width="450px">
      <v-card>
        <v-card-title>Manual Stock Adjustment</v-card-title>
        <v-card-text>
          <v-text-field
            label="Product"
            :model-value="adjustmentTargetProduct ? adjustmentTargetProduct.name : 'N/A'"
            readonly
            class="mb-3"
          ></v-text-field>

          <v-radio-group
            v-model="adjustmentType"
            label="Adjustment Type"
            class="mb-3"
          >
            <v-radio
              v-for="option in adjustmentTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></v-radio>
          </v-radio-group>

          <v-text-field
            v-model="adjustmentQuantity"
            label="Quantity"
            type="number"
            :min="1"
            :error-messages="submittedAdjustment && !adjustmentQuantity ? 'Quantity is required.' : ''"
            class="mb-3"
          ></v-text-field>

          <v-textarea
            v-model="adjustmentReason"
            label="Reason for Adjustment"
            rows="3"
            :error-messages="submittedAdjustment && !adjustmentReason ? 'Reason is required.' : ''"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="hideStockAdjustmentDialog">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="applyStockAdjustment">
            Apply Adjustment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useInventoryStore } from '../stores/inventory';
import { useProductsStore, type Product } from '../stores/products';

const inventoryStore = useInventoryStore();
const productsStore = useProductsStore();

const headers = [
  { title: 'Product Name', key: 'name', sortable: true },
  { title: 'SKU', key: 'sku', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Current Stock', key: 'currentStockLevel', sortable: true },
  { title: 'Purchase Price', key: 'purchasePrice', sortable: true },
  { title: 'Selling Price', key: 'sellingPrice', sortable: true },
  { title: 'Stock Value', key: 'stockValue', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
];

const inventoryItems = computed(() => inventoryStore.inventoryItems);

const filters = ref({
  global: { value: null }
});

// Stock Adjustment Dialog
const stockAdjustmentDialogVisible = ref(false);
const adjustmentTargetProduct = ref<Product | null>(null);
const adjustmentType = ref<'add' | 'remove' | 'set'>('add');
const adjustmentQuantity = ref<number | null>(null);
const adjustmentReason = ref('');
const submittedAdjustment = ref(false);

const adjustmentTypeOptions = ref([
  { label: 'Add to Stock', value: 'add' },
  { label: 'Remove from Stock', value: 'remove' },
  { label: 'Set Exact Stock', value: 'set' }
]);

const openStockAdjustmentDialog = (product: Product | null) => {
  adjustmentTargetProduct.value = product;
  // Reset form
  adjustmentType.value = 'add';
  adjustmentQuantity.value = null;
  adjustmentReason.value = '';
  submittedAdjustment.value = false;
  stockAdjustmentDialogVisible.value = true;
};

const hideStockAdjustmentDialog = () => {
  stockAdjustmentDialogVisible.value = false;
  adjustmentTargetProduct.value = null;
};

const applyStockAdjustment = () => {
  submittedAdjustment.value = true;
  if (!adjustmentTargetProduct.value || !adjustmentQuantity.value || !adjustmentReason.value) {
    return; // Basic validation
  }

  let quantityChange: number;
  const currentStock = adjustmentTargetProduct.value.currentStockLevel ?? 0;

  if (adjustmentType.value === 'add') {
    quantityChange = adjustmentQuantity.value;
  } else if (adjustmentType.value === 'remove') {
    quantityChange = -adjustmentQuantity.value;
  } else { // 'set'
    quantityChange = adjustmentQuantity.value - currentStock;
  }
  
  inventoryStore.manualStockAdjustment(adjustmentTargetProduct.value.id, quantityChange, adjustmentReason.value);
  hideStockAdjustmentDialog();
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return '$0.00'; // Default or placeholder
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const isLowStock = (product: Product): boolean => {
  if (!product.isInventoryTracked || product.currentStockLevel === null) return false;
  return product.currentStockLevel < inventoryStore.lowStockThreshold && product.currentStockLevel > 0;
};

onMounted(() => {
  productsStore.loadProducts(); // Ensures products (which are inventory items) are loaded
  inventoryStore.loadInventoryData(); // For thresholds etc.
});
</script>

<style scoped>
.search-field {
  max-width: 300px;
}
.text-red {
  color: rgb(var(--v-theme-error));
}
.text-orange {
  color: rgb(var(--v-theme-warning));
}
</style> 
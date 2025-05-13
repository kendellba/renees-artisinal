<template>
  <v-card class="product-selector">
    <v-card-title>Select Products</v-card-title>
    <v-card-text>
      <v-row class="mb-3">
        <v-col cols="12" sm="8">
          <v-text-field
            v-model="searchTerm"
            placeholder="Search products..."
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="selectedCategory"
            :items="categoryOptionsWithAll"
            item-title="label"
            item-value="value"
            placeholder="All Categories"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
      </v-row>

      <div class="product-grid">
        <div v-for="product in filteredProducts" :key="product.id" 
             class="product-card border rounded pa-2 ma-1 cursor-pointer transition-background"
             :class="{'product-disabled': product.isInventoryTracked && (product.currentStockLevel ?? 0) <= 0}"
             @click="addProductToCart(product)">
          
          <div class="text-center mb-2">
            <v-icon icon="mdi-package-variant" size="x-large" color="grey"></v-icon>
          </div>
          <div class="product-name font-weight-medium text-center text-body-2 mb-1">{{ product.name }}</div>
          <div class="product-price text-center text-body-2 font-weight-bold mb-1">{{ formatCurrency(product.sellingPrice ?? product.price) }}</div>
          <div v-if="product.isInventoryTracked && product.currentStockLevel !== null" 
               class="product-stock text-center text-caption"
               :class="{
                 'text-red': (product.currentStockLevel ?? 0) <= lowStockThreshold && (product.currentStockLevel ?? 0) > 0, 
                 'text-orange': (product.currentStockLevel ?? 0) === 0
               }">
            Stock: {{ product.currentStockLevel }}
          </div>
          <div v-else-if="product.isInventoryTracked && product.currentStockLevel === null"
               class="product-stock text-center text-caption text-grey">
               Stock: N/A
          </div>
          <div v-else class="product-stock text-center text-caption text-grey">
            Service/MTO
          </div>
        </div>
        <div v-if="filteredProducts.length === 0" class="col-12 text-center pa-3">
          No products match your criteria.
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProductsStore, type Product } from '../../stores/products';
import { useInventoryStore } from '../../stores/inventory';

const productsStore = useProductsStore();
const inventoryStore = useInventoryStore(); // For low stock threshold

const emit = defineEmits(['add-to-cart']);

const searchTerm = ref('');
const selectedCategory = ref<string | null>(null); // null for 'All Categories'

const categoryOptions = [
  { label: 'Pastries', value: 'Pastries' },
  { label: 'Art Portraits', value: 'Art Portraits' },
  { label: 'Burgers', value: 'Burgers' },
  { label: 'Greeting Cards', value: 'Greeting Cards' },
  { label: 'Other', value: 'Other' }
];

const categoryOptionsWithAll = computed(() => {
  return [{ label: 'All Categories', value: null }, ...categoryOptions];
});

const lowStockThreshold = computed(() => inventoryStore.lowStockThreshold);

const filteredProducts = computed(() => {
  return productsStore.products.filter(product => {
    const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.value.toLowerCase());
    const matchesCategory = selectedCategory.value ? product.category === selectedCategory.value : true;
    return matchesSearchTerm && matchesCategory;
  });
});

const addProductToCart = (product: Product) => {
  if (product.isInventoryTracked && (product.currentStockLevel ?? 0) <= 0) {
    // Optionally show a message that item is out of stock
    console.warn("Cannot add out-of-stock item:", product.name);
    return;
  }
  emit('add-to-cart', product);
};

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

onMounted(() => {
  if (productsStore.products.length === 0) {
      productsStore.loadProducts(); // Ensure products are loaded
  }
});
</script>

<style scoped>
.product-selector {
  height: 100%;
}

.product-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem; /* Gap between cards */
  max-height: calc(70vh - 120px); /* Adjust based on header/filter height */
  overflow-y: auto;
}

.product-card {
  flex: 0 0 calc(33.333% - 1rem); /* Adjust for 3 cards per row, considering gap */
  max-width: calc(33.333% - 1rem);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 180px; /* Ensure cards have a minimum height */
}

.product-card.product-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.product-card:hover:not(.product-disabled) {
  background-color: rgba(0,0,0,0.05);
}

.cursor-pointer {
  cursor: pointer;
}

.transition-background {
  transition: background-color 0.2s;
}

.text-red {
  color: #F44336 !important;
}

.text-orange {
  color: #FF9800 !important;
}

/* Responsive adjustments for smaller screens */
@media (max-width: 992px) { /* lg breakpoint */
  .product-card {
    flex: 0 0 calc(50% - 1rem); /* 2 cards per row */
    max-width: calc(50% - 1rem);
  }
}

@media (max-width: 576px) { /* sm breakpoint */
  .product-card {
    flex: 0 0 calc(100% - 1rem); /* 1 card per row */
    max-width: calc(100% - 1rem);
  }
  .product-grid {
    max-height: calc(60vh - 100px); /* Adjust for smaller screens */
  }
}
</style> 
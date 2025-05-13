<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">Product Builder</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card v-if="!showBuilder && !selectedProduct">
          <v-card-title>
            <v-row align="center">
              <v-col>
                <span class="text-h5">Products with Recipes</span>
              </v-col>
              <v-col cols="auto">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="startNewProduct"
                >
                  Create New Product
                </v-btn>
              </v-col>
            </v-row>
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="search"
                  label="Search products"
                  density="compact"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="filterCategory"
                  :items="['All Categories', ...categoryOptions]"
                  label="Filter by Category"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="sortOption"
                  :items="sortOptions"
                  label="Sort by"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
            
            <v-data-table
              :headers="headers"
              :items="filteredProducts"
              :search="search"
              hover
              item-value="id"
              class="mt-2"
            >
              <template v-slot:item.name="{ item }">
                {{ item.name }}
                <v-chip
                  v-if="productHasRecipe(item.id)"
                  size="x-small"
                  color="info"
                  class="ml-2"
                >
                  Has Recipe
                </v-chip>
              </template>
              
              <template v-slot:item.price="{ item }">
                {{ formatCurrency(item.price) }}
              </template>
              
              <template v-slot:item.cost="{ item }">
                {{ formatCurrency(item.cost) }}
              </template>
              
              <template v-slot:item.profit="{ item }">
                {{ formatCurrency((item.price ?? 0) - (item.cost ?? 0)) }}
                <span class="text-caption ml-1">({{ calculateMargin(item) }}%)</span>
              </template>
              
              <template v-slot:item.actions="{ item }">
                <v-icon
                  icon="mdi-pencil"
                  color="primary"
                  @click="editProduct(item)"
                  class="mr-2"
                >
                </v-icon>
                <v-icon
                  icon="mdi-content-duplicate"
                  color="info"
                  @click="duplicateProduct(item)"
                  class="mr-2"
                >
                </v-icon>
                <v-icon
                  icon="mdi-delete"
                  color="error"
                  @click="confirmDelete(item)"
                >
                </v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
        
        <ProductBuilder
          v-if="showBuilder"
          :product="selectedProduct"
          :recipe="selectedRecipe"
          @save="handleProductSave"
          @cancel="handleProductCancel"
        />
      </v-col>
    </v-row>
    
    <!-- Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-error text-white">
          Confirm Delete
        </v-card-title>
        <v-card-text class="pt-4">
          Are you sure you want to delete <strong>{{ productToDelete?.name }}</strong>?
          <div v-if="productHasRecipe(productToDelete?.id)" class="mt-2 text-warning">
            <v-icon icon="mdi-alert" class="mr-1"></v-icon>
            This product has a recipe that will also be deleted.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" @click="deleteProduct">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ProductBuilder from '../components/products/ProductBuilder.vue';
import { useProductsStore, type Product } from '../stores/products';
import { useInventoryStore, type Recipe } from '../stores/inventory';

const productsStore = useProductsStore();
const inventoryStore = useInventoryStore();

// State variables
const showBuilder = ref(false);
const selectedProduct = ref<Product | null>(null);
const selectedRecipe = ref<Recipe | null>(null);
const search = ref('');
const filterCategory = ref('All Categories');
const sortOption = ref('name-asc');
const deleteDialog = ref(false);
const productToDelete = ref<Product | null>(null);

// Data table headers
const headers = [
  { title: 'Product Name', key: 'name' },
  { title: 'Category', key: 'category' },
  { title: 'Selling Price', key: 'price' },
  { title: 'Cost', key: 'cost' },
  { title: 'Profit', key: 'profit' },
  { title: 'Actions', key: 'actions', sortable: false }
];

// Options
const categoryOptions = [
  'Bakery', 
  'Beverages', 
  'Desserts', 
  'Entrees', 
  'Appetizers', 
  'Sides', 
  'Specials',
  'Other'
];

const sortOptions = [
  { title: 'Name (A-Z)', value: 'name-asc' },
  { title: 'Name (Z-A)', value: 'name-desc' },
  { title: 'Price (Low-High)', value: 'price-asc' },
  { title: 'Price (High-Low)', value: 'price-desc' },
  { title: 'Cost (Low-High)', value: 'cost-asc' },
  { title: 'Cost (High-Low)', value: 'cost-desc' },
  { title: 'Profit Margin (Low-High)', value: 'margin-asc' },
  { title: 'Profit Margin (High-Low)', value: 'margin-desc' }
];

// Filtered and sorted products
const filteredProducts = computed(() => {
  let filtered = productsStore.products;
  
  // Apply category filter
  if (filterCategory.value !== 'All Categories') {
    filtered = filtered.filter(product => product.category === filterCategory.value);
  }
  
  // Apply sorting
  const [sortField, sortDir] = sortOption.value.split('-');
  
  return [...filtered].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'price') {
      comparison = a.price - b.price;
    } else if (sortField === 'cost') {
      comparison = a.cost - b.cost;
    } else if (sortField === 'margin') {
      const marginA = calculateMarginValue(a);
      const marginB = calculateMarginValue(b);
      comparison = marginA - marginB;
    }
    
    return sortDir === 'asc' ? comparison : -comparison;
  });
});

// Initialize data
onMounted(async () => {
  // Load products if needed
  if (productsStore.products.length === 0) {
    await productsStore.fetchProducts();
  }
});

// Utility functions
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '$0.00';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const calculateMarginValue = (product: Product): number => {
  if (product.price === undefined || product.cost === undefined || product.price <= 0) return 0;
  return ((product.price - product.cost) / product.price) * 100;
};

const calculateMargin = (product: Product): string => {
  return calculateMarginValue(product).toFixed(0);
};

const productHasRecipe = (productId?: number | string): boolean => {
  if (!productId) return false;
  const recipe = inventoryStore.getProductRecipe(productId);
  return !!recipe;
};

// Product management functions
const startNewProduct = () => {
  selectedProduct.value = null;
  selectedRecipe.value = null;
  showBuilder.value = true;
};

const editProduct = async (product: Product) => {
  selectedProduct.value = product;
  selectedRecipe.value = inventoryStore.getProductRecipe(product.id) || null;
  showBuilder.value = true;
};

const duplicateProduct = (product: Product) => {
  const duplicate = { ...product } as Partial<Product>;
  duplicate.id = undefined;
  duplicate.name = `${duplicate.name} (Copy)`;
  selectedProduct.value = duplicate as Product;
  
  // Get the recipe for the original product if it exists
  const originalRecipe = inventoryStore.getProductRecipe(product.id);
  if (originalRecipe) {
    selectedRecipe.value = {
      ...originalRecipe,
      id: '' as string | number,
      productId: 0,
      name: `${originalRecipe.name} (Copy)`
    };
  } else {
    selectedRecipe.value = null;
  }
  
  showBuilder.value = true;
};

const confirmDelete = (product: Product) => {
  productToDelete.value = product;
  deleteDialog.value = true;
};

const deleteProduct = async () => {
  if (!productToDelete.value) return;
  
  try {
    // Delete the recipe first (if exists)
    const recipe = inventoryStore.getProductRecipe(productToDelete.value.id);
    if (recipe) {
      await inventoryStore.deleteRecipe(recipe.id);
    }
    
    // Then delete the product
    await productsStore.deleteProduct(productToDelete.value.id);
    
    deleteDialog.value = false;
    productToDelete.value = null;
  } catch (error) {
    console.error('Error deleting product:', error);
    // Handle error
  }
};

// Form event handlers
const handleProductSave = () => {
  showBuilder.value = false;
  selectedProduct.value = null;
  selectedRecipe.value = null;
};

const handleProductCancel = () => {
  showBuilder.value = false;
  selectedProduct.value = null;
  selectedRecipe.value = null;
};
</script>

<style scoped>
.text-warning {
  color: orange;
}
</style> 
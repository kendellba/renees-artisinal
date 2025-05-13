<template>
  <v-container fluid class="product-management">
    <v-row>
      <v-col>
        <v-card>
          <v-toolbar flat color="primary" class="text-white mb-4">
            <v-btn
              color="success"
              prepend-icon="mdi-plus"
              @click="openNewProductDialog"
            >
              New Product
            </v-btn>
            <v-spacer></v-spacer>
          </v-toolbar>

          <v-data-table
            :headers="headers"
            :items="products"
            :items-per-page="10"
            item-value="id"
            class="elevation-1"
          >
            <template v-slot:item.purchasePrice="{ item }">
              {{ formatCurrency(item.purchasePrice) }}
            </template>
            <template v-slot:item.sellingPrice="{ item }">
              {{ formatCurrency(item.sellingPrice) }}
            </template>
            <template v-slot:item.currentStockLevel="{ item }">
              {{ item.isInventoryTracked ? item.currentStockLevel : 'N/A' }}
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-pencil"
                color="info"
                size="small"
                variant="text"
                class="mr-2"
                @click="editProduct(item)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                color="error"
                size="small"
                variant="text"
                @click="confirmDeleteProduct(item)"
              ></v-btn>
            </template>
            <template v-slot:no-data>
              No products found.
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add/Edit Product Dialog -->
    <v-dialog v-model="productDialogVisible" max-width="600px">
      <v-card>
        <v-card-title>Product Details</v-card-title>
        <v-card-text>
          <ProductForm :productData="selectedProduct" @save="onProductSave" @cancel="hideProductDialog" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete Product Confirmation Dialog -->
    <v-dialog v-model="deleteProductDialogVisible" max-width="450px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text class="d-flex align-center">
          <v-icon icon="mdi-alert" size="large" color="warning" class="mr-3"></v-icon>
          <span v-if="selectedProduct">Are you sure you want to delete <strong>{{selectedProduct.name}}</strong>?</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteProductDialogVisible = false">No</v-btn>
          <v-btn variant="text" color="error" @click="deleteConfirmedProduct">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useProductsStore, type Product } from '../stores/products';
import ProductForm from '../components/ProductForm.vue'; // We will create this component next

const productsStore = useProductsStore();
const products = computed(() => productsStore.products);

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'SKU', key: 'sku', sortable: true },
  { title: 'Purchase Price', key: 'purchasePrice', sortable: true },
  { title: 'Selling Price', key: 'sellingPrice', sortable: true },
  { title: 'Stock Level', key: 'currentStockLevel', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
];

const productDialogVisible = ref(false);
const deleteProductDialogVisible = ref(false);
const selectedProduct = ref<Product | null>(null);

const openNewProductDialog = () => {
  selectedProduct.value = null; // Clear for new product
  productDialogVisible.value = true;
};

const editProduct = (product: Product) => {
  selectedProduct.value = { ...product }; // Create a copy to avoid direct state mutation
  productDialogVisible.value = true;
};

const hideProductDialog = () => {
  productDialogVisible.value = false;
  selectedProduct.value = null;
};

const onProductSave = (product: Product) => {
  if (product.id) {
    productsStore.updateProduct(product);
  } else {
    // For new products, the store's addProduct action handles ID generation
    const { id, ...newProductData } = product; // eslint-disable-line @typescript-eslint/no-unused-vars
    productsStore.addProduct(newProductData as Omit<Product, 'id'>);
  }
  hideProductDialog();
};

const confirmDeleteProduct = (product: Product) => {
  selectedProduct.value = product;
  deleteProductDialogVisible.value = true;
};

const deleteConfirmedProduct = () => {
  if (selectedProduct.value && selectedProduct.value.id) {
    productsStore.deleteProduct(selectedProduct.value.id);
  }
  deleteProductDialogVisible.value = false;
  selectedProduct.value = null;
};

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '$0.00';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); // Adjust currency as needed
};

onMounted(() => {
  // Products are loaded by the store itself upon initialization
});
</script>

<style scoped>
.mr-2 {
  margin-right: 0.5rem;
}
.mr-3 {
  margin-right: 1rem;
}
</style> 
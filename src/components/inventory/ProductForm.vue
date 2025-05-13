<template>
  <form @submit.prevent="submitProduct">
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.name"
          label="Product Name"
          :error-messages="submitted && !formState.name ? 'Name is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.sku"
          label="SKU"
          :error-messages="submitted && !formState.sku ? 'SKU is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.sellingPrice"
          label="Selling Price"
          type="number"
          :min="0"
          :step="0.01"
          prefix="$"
          :error-messages="submitted && !formState.sellingPrice ? 'Selling price is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.purchasePrice"
          label="Purchase Price"
          type="number"
          :min="0"
          :step="0.01"
          prefix="$"
          :error-messages="submitted && !formState.purchasePrice ? 'Purchase price is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.currentStockLevel"
          label="Current Stock Level"
          type="number"
          :min="0"
          :error-messages="submitted && formState.isInventoryTracked && formState.currentStockLevel === null ? 'Stock level is required for tracked items.' : ''"
          :disabled="!formState.isInventoryTracked"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-select
          v-model="formState.category"
          :items="categories"
          label="Category"
          :error-messages="submitted && !formState.category ? 'Category is required.' : ''"
          required
        ></v-select>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.supplier"
          label="Supplier (Optional)"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-switch
          v-model="formState.isInventoryTracked"
          label="Track Inventory"
          color="primary"
          @update:model-value="toggleStockTracking"
        ></v-switch>
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="formState.description"
          label="Description (Optional)"
          rows="3"
        ></v-textarea>
      </v-col>

      <v-col cols="12">
        <v-text-field
          v-model="formState.image"
          label="Image URL (Optional)"
        ></v-text-field>
      </v-col>
    </v-row>

    <div class="d-flex justify-end gap-2 mt-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-close"
        @click="cancelProduct"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-check"
        type="submit"
      >
        {{ isEdit ? 'Update Product' : 'Add Product' }}
      </v-btn>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { type Product } from '../../stores/products';

interface ProductFormState {
  name: string;
  sku: string;
  sellingPrice: number;
  purchasePrice: number;
  currentStockLevel: number | null;
  category: 'Pastries' | 'Art Portraits' | 'Burgers' | 'Greeting Cards' | 'Other';
  supplier?: string;
  description?: string;
  image?: string;
  isInventoryTracked: boolean;
}

interface Props {
  product?: Product;
}

const props = withDefaults(defineProps<Props>(), {
  product: undefined
});

const emit = defineEmits(['submit', 'cancel']);

const isEdit = !!props.product;

const categories = [
  { title: 'Pastries', value: 'Pastries' },
  { title: 'Art Portraits', value: 'Art Portraits' },
  { title: 'Burgers', value: 'Burgers' },
  { title: 'Greeting Cards', value: 'Greeting Cards' },
  { title: 'Other', value: 'Other' }
];

const initialFormState: ProductFormState = {
  name: props.product?.name ?? '',
  sku: props.product?.sku ?? '',
  sellingPrice: props.product?.sellingPrice ?? 0,
  purchasePrice: props.product?.purchasePrice ?? 0,
  currentStockLevel: props.product?.currentStockLevel ?? null,
  category: props.product?.category ?? 'Other',
  supplier: props.product?.supplier ?? '',
  description: props.product?.description ?? '',
  image: props.product?.image ?? '',
  isInventoryTracked: props.product?.isInventoryTracked ?? true
};

const formState = reactive<ProductFormState>({ ...initialFormState });
const submitted = ref(false);

const validateForm = (): boolean => {
  return !!(formState.name && 
    formState.sku && 
    formState.sellingPrice >= 0 && 
    formState.purchasePrice >= 0 && 
    formState.category && 
    (!formState.isInventoryTracked || formState.currentStockLevel !== null));
};

const toggleStockTracking = () => {
  if (!formState.isInventoryTracked) {
    formState.currentStockLevel = null;
  } else {
    formState.currentStockLevel = 0;
  }
};

const submitProduct = () => {
  submitted.value = true;
  if (!validateForm()) {
    return;
  }

  const productToSave: Product = {
    id: props.product?.id ?? '',
    ...formState
  };

  emit('submit', productToSave);
  resetForm();
};

const cancelProduct = () => {
  emit('cancel');
  resetForm();
};

const resetForm = () => {
  Object.assign(formState, { ...initialFormState });
  submitted.value = false;
};
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style> 
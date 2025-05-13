<template>
  <form @submit.prevent="submitProduct">
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.name"
          label="Product Name"
          :error-messages="submitted && !formState.name ? 'Product name is required.' : ''"
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
          v-model.number="formState.purchasePrice"
          label="Purchase Price"
          type="number"
          :min="0"
          :step="0.01"
          prefix="$"
          :error-messages="submitted && formState.purchasePrice === null ? 'Purchase price is required.' : ''"
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
          :error-messages="submitted && formState.sellingPrice === null ? 'Selling price is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.quantityInStock"
          label="Quantity in Stock"
          type="number"
          :min="0"
          :error-messages="submitted && formState.quantityInStock === null ? 'Quantity in stock is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.reorderPoint"
          label="Reorder Point"
          type="number"
          :min="0"
          :error-messages="submitted && formState.reorderPoint === null ? 'Reorder point is required.' : ''"
          required
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
        <v-select
          v-model="formState.unit"
          :items="units"
          label="Unit"
          :error-messages="submitted && !formState.unit ? 'Unit is required.' : ''"
          required
        ></v-select>
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="formState.description"
          label="Description"
          rows="3"
        ></v-textarea>
      </v-col>

      <v-col cols="12" md="6">
        <v-switch
          v-model="formState.isInventoryTracked"
          label="Track Inventory"
          color="primary"
        ></v-switch>
      </v-col>

      <v-col cols="12" md="6">
        <v-switch
          v-model="formState.isActive"
          label="Active"
          color="primary"
        ></v-switch>
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
        {{ isEdit ? 'Update Product' : 'Create Product' }}
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
  purchasePrice: number;
  sellingPrice: number;
  quantityInStock: number;
  reorderPoint: number;
  category: string;
  unit: string;
  description?: string;
  isInventoryTracked: boolean;
  isActive: boolean;
}

interface Props {
  product?: Product;
}

const props = withDefaults(defineProps<Props>(), {
  product: undefined
});

const emit = defineEmits(['submit', 'cancel']);

const isEdit = !!props.product;
const submitted = ref(false);

const categories = [
  'Bakery',
  'Beverages',
  'Dairy',
  'Dry Goods',
  'Frozen',
  'Meat',
  'Produce',
  'Snacks',
  'Other'
];

const units = [
  'Each',
  'Pound',
  'Ounce',
  'Gallon',
  'Quart',
  'Pint',
  'Cup',
  'Dozen',
  'Box',
  'Bag',
  'Case',
  'Other'
];

const initialFormState: ProductFormState = {
  name: props.product?.name ?? '',
  sku: (props.product as any)?.sku ?? '',
  purchasePrice: props.product?.purchasePrice ?? 0,
  sellingPrice: props.product?.sellingPrice ?? 0,
  quantityInStock: props.product && 'quantityInStock' in props.product
    ? (props.product as any).quantityInStock ?? 0
    : 0,
  reorderPoint: props.product && 'reorderPoint' in props.product
    ? (props.product as any).reorderPoint ?? 0
    : 0,
  category: props.product?.category ?? '',
  unit: props.product?.unit ?? '',
  description: props.product?.description ?? '',
  isInventoryTracked: props.product?.isInventoryTracked ?? true,
  isActive: (props.product && 'isActive' in props.product) ? (props.product as any).isActive ?? true : true
};

const formState = reactive<ProductFormState>({ ...initialFormState });

const validateForm = (): boolean => {
  if (!formState.name || !formState.sku || formState.purchasePrice === null || 
      formState.sellingPrice === null || formState.quantityInStock === null || 
      formState.reorderPoint === null || !formState.category || !formState.unit) {
    return false;
  }
  return true;
};

const submitProduct = () => {
  submitted.value = true;
  if (!validateForm()) {
    return;
  }

  const productToSave: Product = {
    id: typeof props.product?.id === 'number' ? props.product.id : 0,
    name: formState.name,
    purchasePrice: formState.purchasePrice,
    sellingPrice: formState.sellingPrice,
    category: formState.category,
    unit: formState.unit,
    description: formState.description ?? '',
    isInventoryTracked: formState.isInventoryTracked,
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    supplier: '',
    lastRestockDate: ''
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
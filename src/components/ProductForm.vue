<template>
  <v-form @submit.prevent="submitForm" v-model="isFormValid">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="formState.name"
            label="Name"
            required
            :rules="[v => !!v || 'Name is required']"
            autofocus
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-select
            v-model="formState.category"
            :items="categoryOptions"
            item-title="label"
            item-value="value"
            label="Category"
            required
            :rules="[v => !!v || 'Category is required']"
          ></v-select>
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="formState.sku"
            label="SKU (Stock Keeping Unit)"
            hint="Leave blank to auto-generate"
            persistent-hint
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="formState.purchasePrice"
            label="Purchase Price"
            prefix="$"
            type="number"
            min="0"
            required
            :rules="[v => v !== null || 'Purchase Price is required']"
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="formState.sellingPrice"
            label="Selling Price"
            prefix="$"
            type="number"
            min="0"
            required
            :rules="[v => v !== null || 'Selling Price is required']"
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-checkbox
            v-model="formState.isInventoryTracked"
            label="Track Inventory"
            @update:model-value="toggleStockTracking"
          ></v-checkbox>
        </v-col>

        <v-col cols="12" v-if="formState.isInventoryTracked">
          <v-text-field
            v-model.number="formState.currentStockLevel"
            label="Current Stock Level"
            type="number"
            min="0"
            required
            :rules="[v => !formState.isInventoryTracked || v !== null || 'Stock level is required for tracked items']"
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="formState.supplier"
            label="Supplier (Optional)"
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-textarea
            v-model="formState.description"
            label="Description (Optional)"
            rows="3"
          ></v-textarea>
        </v-col>
      </v-row>

      <v-card-actions class="d-flex justify-end">
        <v-btn variant="text" @click="cancelForm">
          Cancel
        </v-btn>
        <v-btn 
          type="submit" 
          color="primary" 
          :disabled="!isFormValid"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-container>
  </v-form>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, reactive } from 'vue';
import type { Product } from '../stores/products';

interface Props {
  productData?: Product | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['save', 'cancel']);

const initialFormState: Omit<Product, 'id'> = {
  name: '',
  category: 'Other',
  sku: '',
  purchasePrice: 0,
  sellingPrice: 0,
  currentStockLevel: null,
  isInventoryTracked: true,
  supplier: '',
  description: '',
  image: '' // Placeholder for image path/url
};

// Use reactive for the form state to ensure deep reactivity for nested objects if any in future
const formState = reactive<Omit<Product, 'id' | 'currentStockLevel'> & { currentStockLevel: number | null }>({
    ...initialFormState
});

const isFormValid = ref(true);
const submitted = ref(false);

const categoryOptions = [
  { label: 'Pastries', value: 'Pastries' },
  { label: 'Art Portraits', value: 'Art Portraits' },
  { label: 'Burgers', value: 'Burgers' },
  { label: 'Greeting Cards', value: 'Greeting Cards' },
  { label: 'Other', value: 'Other' }
];

watch(() => props.productData, (newVal) => {
  if (newVal) {
    // Editing an existing product
    // Ensure all fields from Product interface are mapped
    Object.assign(formState, {
        ...initialFormState, // Apply defaults first
        ...newVal,
        currentStockLevel: newVal.isInventoryTracked ? newVal.currentStockLevel : null
    });
  } else {
    // Adding a new product, reset to initial state
    Object.assign(formState, {
        ...initialFormState,
        currentStockLevel: initialFormState.isInventoryTracked ? 0 : null // Default stock for new tracked item
    });
  }
  submitted.value = false; // Reset submission state on data change
}, { immediate: true, deep: true });

const toggleStockTracking = () => {
    if (!formState.isInventoryTracked) {
        formState.currentStockLevel = null;
    } else {
        // If re-enabling tracking, default to 0 if it was null
        formState.currentStockLevel = formState.currentStockLevel === null ? 0 : formState.currentStockLevel;
    }
};

const submitForm = () => {
  submitted.value = true;
  
  if (!isFormValid.value) {
    return; // Prevent submission if validation fails
  }

  const productToSave: Product = {
    id: props.productData?.id || '', // Keep ID if editing, empty for new (store will generate)
    ...formState,
    currentStockLevel: formState.isInventoryTracked ? (formState.currentStockLevel ?? 0) : null,
  };
  emit('save', productToSave);
  resetForm();
};

const cancelForm = () => {
  emit('cancel');
  resetForm();
};

const resetForm = () => {
    Object.assign(formState, initialFormState);
    formState.currentStockLevel = initialFormState.isInventoryTracked ? 0 : null;
    submitted.value = false;
}
</script>

<style scoped>
.p-field > label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}
.p-dialog-footer {
    padding-top: 1rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}
.mb-3 {
    margin-bottom: 1rem;
}
.ml-2 {
    margin-left: 0.5rem;
}
</style> 
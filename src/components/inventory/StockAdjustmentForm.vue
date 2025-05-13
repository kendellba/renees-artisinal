<template>
  <form @submit.prevent="submitAdjustment">
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          label="Product"
          :model-value="product ? product.name : 'N/A'"
          readonly
          class="mb-3"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
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
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="adjustmentQuantity"
          label="Quantity"
          type="number"
          :min="1"
          :error-messages="submitted && !adjustmentQuantity ? 'Quantity is required.' : ''"
          class="mb-3"
        ></v-text-field>
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="adjustmentReason"
          label="Reason for Adjustment"
          rows="3"
          :error-messages="submitted && !adjustmentReason ? 'Reason is required.' : ''"
        ></v-textarea>
      </v-col>
    </v-row>

    <div class="d-flex justify-end gap-2 mt-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-close"
        @click="cancelAdjustment"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-check"
        type="submit"
      >
        Apply Adjustment
      </v-btn>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { type Product } from '../../stores/products';

interface Props {
  product: Product | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['submit', 'cancel']);

const adjustmentTypeOptions = [
  { label: 'Add to Stock', value: 'add' },
  { label: 'Remove from Stock', value: 'remove' },
  { label: 'Set Exact Stock', value: 'set' }
];

const adjustmentType = ref<'add' | 'remove' | 'set'>('add');
const adjustmentQuantity = ref<number | null>(null);
const adjustmentReason = ref('');
const submitted = ref(false);

const validateForm = (): boolean => {
  if (!adjustmentQuantity.value || !adjustmentReason.value) {
    return false;
  }
  return true;
};

const calculateQuantityChange = (): number => {
  if (!props.product || !adjustmentQuantity.value) return 0;
  
  const currentStock = props.product.currentStockLevel ?? 0;
  
  if (adjustmentType.value === 'add') {
    return adjustmentQuantity.value;
  } else if (adjustmentType.value === 'remove') {
    return -adjustmentQuantity.value;
  } else { // 'set'
    return adjustmentQuantity.value - currentStock;
  }
};

const submitAdjustment = () => {
  submitted.value = true;
  if (!validateForm() || !props.product) {
    return;
  }

  const adjustment = {
    productId: props.product.id,
    quantityChange: calculateQuantityChange(),
    reason: adjustmentReason.value,
    type: adjustmentType.value
  };

  emit('submit', adjustment);
  resetForm();
};

const cancelAdjustment = () => {
  emit('cancel');
  resetForm();
};

const resetForm = () => {
  adjustmentType.value = 'add';
  adjustmentQuantity.value = null;
  adjustmentReason.value = '';
  submitted.value = false;
};
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style> 
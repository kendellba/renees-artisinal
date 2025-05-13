<template>
  <form @submit.prevent="applyDiscount">
    <v-row>
      <v-col cols="12" md="6">
        <v-radio-group
          v-model="discountType"
          label="Discount Type"
          class="mb-3"
        >
          <v-radio
            v-for="option in discountTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          ></v-radio>
        </v-radio-group>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-if="discountType === 'percentage'"
          v-model.number="percentageValue"
          label="Discount Percentage"
          type="number"
          :min="0"
          :max="100"
          suffix="%"
          :error-messages="submitted && !percentageValue ? 'Percentage is required.' : ''"
          @update:model-value="calculateDiscount"
        ></v-text-field>

        <v-text-field
          v-else
          v-model.number="fixedValue"
          label="Discount Amount"
          type="number"
          :min="0"
          :max="maxAmount"
          prefix="$"
          :error-messages="submitted && !fixedValue ? 'Amount is required.' : ''"
          @update:model-value="calculateDiscount"
        ></v-text-field>
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="discountReason"
          label="Reason for Discount (Optional)"
          rows="2"
        ></v-textarea>
      </v-col>
    </v-row>

    <div class="d-flex justify-end gap-2 mt-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-close"
        @click="cancelDiscount"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-check"
        type="submit"
      >
        Apply Discount
      </v-btn>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  originalAmount: number;
  maxPercentage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxPercentage: 100
});

const emit = defineEmits(['apply', 'cancel']);

const discountTypeOptions = [
  { label: 'Percentage', value: 'percentage' },
  { label: 'Fixed Amount', value: 'fixed' }
];

const discountType = ref<'percentage' | 'fixed'>('percentage');
const percentageValue = ref<number | null>(null);
const fixedValue = ref<number | null>(null);
const discountReason = ref('');
const submitted = ref(false);

const maxAmount = computed(() => props.originalAmount);

const calculateDiscount = () => {
  let discountAmount = 0;
  
  if (discountType.value === 'percentage' && percentageValue.value) {
    discountAmount = (props.originalAmount * percentageValue.value) / 100;
  } else if (discountType.value === 'fixed' && fixedValue.value) {
    discountAmount = fixedValue.value;
  }

  return Math.min(discountAmount, props.originalAmount);
};

const validateForm = (): boolean => {
  if (discountType.value === 'percentage') {
    return percentageValue.value !== null && percentageValue.value >= 0 && percentageValue.value <= props.maxPercentage;
  } else {
    return fixedValue.value !== null && fixedValue.value >= 0 && fixedValue.value <= props.originalAmount;
  }
};

const applyDiscount = () => {
  submitted.value = true;
  if (!validateForm()) {
    return;
  }

  const discount = {
    type: discountType.value,
    value: discountType.value === 'percentage' ? percentageValue.value : fixedValue.value,
    amount: calculateDiscount(),
    reason: discountReason.value
  };

  emit('apply', discount);
  resetForm();
};

const cancelDiscount = () => {
  emit('cancel');
  resetForm();
};

const resetForm = () => {
  discountType.value = 'percentage';
  percentageValue.value = null;
  fixedValue.value = null;
  discountReason.value = '';
  submitted.value = false;
};
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style> 
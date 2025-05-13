<template>
  <form @submit.prevent="submitPayment">
    <v-row>
      <v-col cols="12" md="6">
        <v-select
          v-model="formState.paymentMethod"
          :items="paymentMethods"
          label="Payment Method"
          required
          :error-messages="submitted && !formState.paymentMethod ? 'Payment method is required.' : ''"
        ></v-select>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.amount"
          label="Amount"
          type="number"
          :min="0"
          :step="0.01"
          required
          prefix="$"
          :error-messages="submitted && !formState.amount ? 'Amount is required.' : ''"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6" v-if="formState.paymentMethod === 'Card'">
        <v-text-field
          v-model="formState.cardNumber"
          label="Card Number"
          :error-messages="submitted && formState.paymentMethod === 'Card' && !formState.cardNumber ? 'Card number is required.' : ''"
          mask="#### #### #### ####"
        ></v-text-field>
      </v-col>

      <v-col cols="6" md="3" v-if="formState.paymentMethod === 'Card'">
        <v-text-field
          v-model="formState.expiryDate"
          label="Expiry Date"
          :error-messages="submitted && formState.paymentMethod === 'Card' && !formState.expiryDate ? 'Expiry date is required.' : ''"
          mask="##/##"
          placeholder="MM/YY"
        ></v-text-field>
      </v-col>

      <v-col cols="6" md="3" v-if="formState.paymentMethod === 'Card'">
        <v-text-field
          v-model="formState.cvv"
          label="CVV"
          :error-messages="submitted && formState.paymentMethod === 'Card' && !formState.cvv ? 'CVV is required.' : ''"
          mask="###"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6" v-if="formState.paymentMethod === 'Bank Transfer'">
        <v-text-field
          v-model="formState.accountNumber"
          label="Account Number"
          :error-messages="submitted && formState.paymentMethod === 'Bank Transfer' && !formState.accountNumber ? 'Account number is required.' : ''"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6" v-if="formState.paymentMethod === 'Bank Transfer'">
        <v-text-field
          v-model="formState.routingNumber"
          label="Routing Number"
          :error-messages="submitted && formState.paymentMethod === 'Bank Transfer' && !formState.routingNumber ? 'Routing number is required.' : ''"
        ></v-text-field>
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="formState.notes"
          label="Payment Notes (Optional)"
          rows="2"
        ></v-textarea>
      </v-col>
    </v-row>

    <div class="d-flex justify-end gap-2 mt-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-close"
        @click="cancelPayment"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-check"
        type="submit"
      >
        Process Payment
      </v-btn>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

interface PaymentFormState {
  paymentMethod: string;
  amount: number | null;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  accountNumber?: string;
  routingNumber?: string;
  notes?: string;
}

interface Props {
  initialAmount?: number;
  allowedPaymentMethods?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  initialAmount: 0,
  allowedPaymentMethods: () => ['Cash', 'Card', 'Bank Transfer', 'Other']
});

const emit = defineEmits(['submit', 'cancel']);

const paymentMethods = props.allowedPaymentMethods.map(method => ({
  title: method,
  value: method
}));

const initialFormState: PaymentFormState = {
  paymentMethod: 'Cash',
  amount: props.initialAmount,
  notes: ''
};

const formState = reactive<PaymentFormState>({ ...initialFormState });
const submitted = ref(false);

const validateForm = (): boolean => {
  if (!formState.paymentMethod || !formState.amount) return false;
  
  if (formState.paymentMethod === 'Card') {
    if (!formState.cardNumber || !formState.expiryDate || !formState.cvv) return false;
  }
  
  if (formState.paymentMethod === 'Bank Transfer') {
    if (!formState.accountNumber || !formState.routingNumber) return false;
  }
  
  return true;
};

const submitPayment = () => {
  submitted.value = true;
  if (!validateForm()) {
    return;
  }

  emit('submit', { ...formState });
  resetForm();
};

const cancelPayment = () => {
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
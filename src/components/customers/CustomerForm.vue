<template>
  <form @submit.prevent="submitCustomer">
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.name"
          label="Customer Name"
          :error-messages="submitted && !formState.name ? 'Customer name is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.email"
          label="Email"
          type="email"
          :error-messages="submitted && !formState.email ? 'Email is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.phone"
          label="Phone"
          :error-messages="submitted && !formState.phone ? 'Phone is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.address"
          label="Address"
          :error-messages="submitted && !formState.address ? 'Address is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.city"
          label="City"
          :error-messages="submitted && !formState.city ? 'City is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.state"
          label="State"
          :error-messages="submitted && !formState.state ? 'State is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.zipCode"
          label="ZIP Code"
          :error-messages="submitted && !formState.zipCode ? 'ZIP code is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-select
          v-model="formState.customerType"
          :items="customerTypes"
          label="Customer Type"
          :error-messages="submitted && !formState.customerType ? 'Customer type is required.' : ''"
          required
        ></v-select>
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="formState.notes"
          label="Notes (Optional)"
          rows="3"
        ></v-textarea>
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
        @click="cancelCustomer"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-check"
        type="submit"
      >
        {{ isEdit ? 'Update Customer' : 'Create Customer' }}
      </v-btn>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { type Customer } from '../../stores/customers';

interface CustomerFormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  customerType: 'Retail' | 'Wholesale' | 'Online' | 'Other';
  notes?: string;
  isActive: boolean;
}

interface Props {
  customer?: Customer;
}

const props = withDefaults(defineProps<Props>(), {
  customer: undefined
});

const emit = defineEmits(['submit', 'cancel']);

const isEdit = !!props.customer;
const submitted = ref(false);

const customerTypes = [
  { title: 'Retail', value: 'Retail' },
  { title: 'Wholesale', value: 'Wholesale' },
  { title: 'Online', value: 'Online' },
  { title: 'Other', value: 'Other' }
];

const initialFormState: CustomerFormState = {
  name: props.customer?.name ?? '',
  email: props.customer?.email ?? '',
  phone: props.customer?.phone ?? '',
  address: props.customer?.address ?? '',
  city: props.customer?.city ?? '',
  state: props.customer?.state ?? '',
  zipCode: props.customer?.zipCode ?? '',
  customerType: props.customer?.customerType ?? 'Retail',
  notes: props.customer?.notes ?? '',
  isActive: props.customer?.isActive ?? true
};

const formState = reactive<CustomerFormState>({ ...initialFormState });

const validateForm = (): boolean => {
  if (!formState.name || !formState.email || !formState.phone || 
      !formState.address || !formState.city || !formState.state || 
      !formState.zipCode || !formState.customerType) {
    return false;
  }
  return true;
};

const submitCustomer = () => {
  submitted.value = true;
  if (!validateForm()) {
    return;
  }

  const customerToSave: Customer = {
    id: props.customer?.id ?? '',
    ...formState
  };

  emit('submit', customerToSave);
  resetForm();
};

const cancelCustomer = () => {
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
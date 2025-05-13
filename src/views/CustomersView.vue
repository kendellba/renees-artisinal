<template>
  <div class="customers-view pa-4">
    <v-card class="mb-4">
      <v-card-actions>
        <v-btn color="success" prepend-icon="mdi-plus" @click="openNewCustomerDialog">
          New Customer
        </v-btn>
      </v-card-actions>
    </v-card>

    <CustomerList @edit="editCustomer" />

    <!-- Add/Edit Customer Dialog -->
    <v-dialog v-model="customerDialogVisible" max-width="800px">
      <v-card>
        <v-card-title>
          {{ selectedCustomer ? 'Edit Customer' : 'Add New Customer' }}
        </v-card-title>
        <v-card-text>
          <CustomerForm 
            :customerData="selectedCustomer" 
            @save="onCustomerSave" 
            @cancel="hideCustomerDialog" 
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCustomerStore, type Customer } from '../stores/customers';
import CustomerList from '../components/customers/CustomerList.vue';
import CustomerForm from '../components/customers/CustomerForm.vue';

const customerStore = useCustomerStore();

const customerDialogVisible = ref(false);
const selectedCustomer = ref<Customer | null>(null);

const openNewCustomerDialog = () => {
  selectedCustomer.value = null;
  customerDialogVisible.value = true;
};

const editCustomer = (customer: Customer) => {
  selectedCustomer.value = JSON.parse(JSON.stringify(customer)); // Deep copy for editing
  customerDialogVisible.value = true;
};

const hideCustomerDialog = () => {
  customerDialogVisible.value = false;
  selectedCustomer.value = null;
};

const onCustomerSave = (customer: Customer) => {
  if (customer.id && customerStore.getCustomerById(customer.id)) {
    customerStore.updateCustomer(customer);
  } else {
    const { id, ...newCustomerData } = customer;
    customerStore.addCustomer(newCustomerData);
  }
  hideCustomerDialog();
};

onMounted(() => {
  customerStore.loadCustomers();
});
</script> 
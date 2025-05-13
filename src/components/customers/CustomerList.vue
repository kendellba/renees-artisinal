<template>
  <v-card>
    <v-data-table
      :items="customers"
      :items-per-page="10"
      :headers="headers"
      :search="filters.global.value"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>Customers</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="filters.global.value"
            prepend-inner-icon="mdi-magnify"
            label="Search Customers"
            single-line
            hide-details
            density="compact"
            class="search-field"
          ></v-text-field>
        </v-toolbar>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          icon="mdi-eye"
          color="info"
          variant="text"
          size="small"
          class="mr-2"
          @click="viewCustomer(item.raw)"
        ></v-btn>
        <v-btn
          icon="mdi-pencil"
          color="warning"
          variant="text"
          size="small"
          class="mr-2"
          @click="editCustomer(item.raw)"
        ></v-btn>
        <v-btn
          icon="mdi-delete"
          color="error"
          variant="text"
          size="small"
          @click="confirmDeleteCustomer(item.raw)"
        ></v-btn>
      </template>

      <template v-slot:no-data>
        No customers found.
      </template>
    </v-data-table>

    <!-- Customer Details Dialog -->
    <v-dialog v-model="customerDetailsDialogVisible" max-width="600px">
      <v-card>
        <v-card-title>Customer Details</v-card-title>
        <v-card-text v-if="selectedCustomer">
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-account"></v-icon>
              </template>
              <template v-slot:default>
                <v-list-item-title>{{ selectedCustomer.name }}</v-list-item-title>
              </template>
            </v-list-item>

            <v-list-item v-if="selectedCustomer.email">
              <template v-slot:prepend>
                <v-icon icon="mdi-email"></v-icon>
              </template>
              <template v-slot:default>
                <v-list-item-title>{{ selectedCustomer.email }}</v-list-item-title>
              </template>
            </v-list-item>

            <v-list-item v-if="selectedCustomer.phone">
              <template v-slot:prepend>
                <v-icon icon="mdi-phone"></v-icon>
              </template>
              <template v-slot:default>
                <v-list-item-title>{{ selectedCustomer.phone }}</v-list-item-title>
              </template>
            </v-list-item>

            <v-list-item v-if="selectedCustomer.address">
              <template v-slot:prepend>
                <v-icon icon="mdi-map-marker"></v-icon>
              </template>
              <template v-slot:default>
                <v-list-item-title>{{ selectedCustomer.address }}</v-list-item-title>
              </template>
            </v-list-item>

            <v-list-item v-if="selectedCustomer.notes">
              <template v-slot:prepend>
                <v-icon icon="mdi-note"></v-icon>
              </template>
              <template v-slot:default>
                <v-list-item-title>{{ selectedCustomer.notes }}</v-list-item-title>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="customerDetailsDialogVisible = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogVisible" max-width="450px">
      <v-card>
        <v-card-title class="text-h5">
          Confirm Delete
        </v-card-title>
        <v-card-text class="d-flex align-center">
          <v-icon icon="mdi-alert" color="warning" size="large" class="mr-3"></v-icon>
          <span v-if="customerToDelete">
            Are you sure you want to delete customer <b>{{ customerToDelete.name }}</b>?
          </span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deleteDialogVisible = false">
            No
          </v-btn>
          <v-btn color="error" variant="text" @click="deleteConfirmedCustomer">
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCustomerStore, type Customer } from '../../stores/customers';

const customerStore = useCustomerStore();

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Phone', key: 'phone', sortable: true },
  { title: 'Address', key: 'address', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
];

const customers = computed(() => customerStore.customers);

const filters = ref({
  global: { value: null }
});

const customerDetailsDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const selectedCustomer = ref<Customer | null>(null);
const customerToDelete = ref<Customer | null>(null);

const viewCustomer = (customer: Customer) => {
  selectedCustomer.value = customer;
  customerDetailsDialogVisible.value = true;
};

const editCustomer = (customer: Customer) => {
  emit('edit', customer);
};

const confirmDeleteCustomer = (customer: Customer) => {
  customerToDelete.value = customer;
  deleteDialogVisible.value = true;
};

const deleteConfirmedCustomer = () => {
  if (customerToDelete.value && customerToDelete.value.id) {
    customerStore.deleteCustomer(customerToDelete.value.id);
  }
  deleteDialogVisible.value = false;
  customerToDelete.value = null;
};

const emit = defineEmits(['edit']);
</script>

<style scoped>
.search-field {
  max-width: 300px;
}
</style> 
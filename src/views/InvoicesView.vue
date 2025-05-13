<template>
  <div class="invoicing-view pa-4">
    <v-card class="mb-4">
      <v-card-actions>
        <v-btn color="success" prepend-icon="mdi-plus" @click="openNewInvoiceDialog">
          New Invoice
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card>
      <v-data-table
        :items="invoices"
        :items-per-page="10"
        :headers="headers"
        :search="filters.global.value"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Invoices</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="filters.global.value"
              prepend-inner-icon="mdi-magnify"
              label="Search Invoices"
              single-line
              hide-details
              density="compact"
              class="search-field"
            ></v-text-field>
          </v-toolbar>
        </template>

        <template v-slot:item.customerName="{ item }">
          {{ getCustomerName(item.raw.customerId) }}
        </template>

        <template v-slot:item.issueDate="{ item }">
          {{ new Date(item.raw.issueDate).toLocaleDateString() }}
        </template>

        <template v-slot:item.dueDate="{ item }">
          {{ new Date(item.raw.dueDate).toLocaleDateString() }}
        </template>

        <template v-slot:item.totalAmount="{ item }">
          {{ formatCurrency(item.raw.totalAmount) }}
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.raw.status)"
            size="small"
          >
            {{ item.raw.status }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-eye"
            color="info"
            variant="text"
            size="small"
            class="mr-2"
            @click="viewInvoice(item.raw)"
          ></v-btn>
          <v-btn
            icon="mdi-pencil"
            color="warning"
            variant="text"
            size="small"
            class="mr-2"
            @click="editInvoice(item.raw)"
            :disabled="item.raw.status === 'Paid'"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            color="error"
            variant="text"
            size="small"
            @click="confirmDeleteInvoice(item.raw)"
          ></v-btn>
        </template>

        <template v-slot:no-data>
          No invoices found.
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Invoice Dialog -->
    <v-dialog v-model="invoiceDialogVisible" max-width="800px">
      <v-card>
        <v-card-title>
          {{ selectedInvoice ? 'Edit Invoice' : 'Create New Invoice' }}
        </v-card-title>
        <v-card-text>
          <InvoiceForm :invoiceData="selectedInvoice" :customers="customerStore.customers" @save="onInvoiceSave" @cancel="hideInvoiceDialog" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete Invoice Confirmation Dialog -->
    <v-dialog v-model="deleteInvoiceDialogVisible" max-width="450px">
      <v-card>
        <v-card-title class="text-h5">
          Confirm Delete
        </v-card-title>
        <v-card-text class="d-flex align-center">
          <v-icon icon="mdi-alert" color="warning" size="large" class="mr-3"></v-icon>
          <span v-if="invoiceToDelete">
            Are you sure you want to delete Invoice #<b>{{invoiceToDelete.invoiceNumber}}</b>?
          </span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deleteInvoiceDialogVisible = false">
            No
          </v-btn>
          <v-btn color="error" variant="text" @click="deleteConfirmedInvoice">
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- View Invoice Details Dialog -->
    <v-dialog v-model="viewInvoiceDialogVisible" max-width="800px">
      <v-card>
        <v-card-title>Invoice Details</v-card-title>
        <v-card-text>
          <InvoiceDetailView v-if="invoiceToView" :invoice="invoiceToView" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="viewInvoiceDialogVisible = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useInvoicesStore, type Invoice, type InvoiceStatus } from '../stores/invoices';
import { useCustomerStore } from '../stores/customers';
import InvoiceForm from '../components/invoices/InvoiceForm.vue';
import InvoiceDetailView from '../components/invoices/InvoiceDetailView.vue';

const invoiceStore = useInvoicesStore();
const customerStore = useCustomerStore();

const headers = [
  { title: 'Invoice #', key: 'invoiceNumber', sortable: true },
  { title: 'Customer', key: 'customerName', sortable: true },
  { title: 'Issue Date', key: 'issueDate', sortable: true },
  { title: 'Due Date', key: 'dueDate', sortable: true },
  { title: 'Total Amount', key: 'totalAmount', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
];

const invoices = computed(() => 
  invoiceStore.invoices.sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
);

const invoiceDialogVisible = ref(false);
const deleteInvoiceDialogVisible = ref(false);
const viewInvoiceDialogVisible = ref(false);

const selectedInvoice = ref<Invoice | null>(null);
const invoiceToDelete = ref<Invoice | null>(null);
const invoiceToView = ref<Invoice | null>(null);

const filters = ref({
  global: { value: null }
});

const openNewInvoiceDialog = () => {
  selectedInvoice.value = null;
  invoiceDialogVisible.value = true;
};

const editInvoice = (invoice: Invoice) => {
  selectedInvoice.value = JSON.parse(JSON.stringify(invoice)); // Deep copy for editing
  invoiceDialogVisible.value = true;
};

const viewInvoice = (invoice: Invoice) => {
  invoiceToView.value = invoice;
  viewInvoiceDialogVisible.value = true;
};

const hideInvoiceDialog = () => {
  invoiceDialogVisible.value = false;
  selectedInvoice.value = null;
};

const onInvoiceSave = (invoice: Invoice) => {
  if (invoice.id && invoiceStore.getInvoiceById(invoice.id)) {
    invoiceStore.updateInvoice(invoice);
  } else {
    const { id, invoiceNumber, ...newInvoiceData } = invoice;
    invoiceStore.addInvoice(newInvoiceData as Omit<Invoice, 'id' | 'invoiceNumber' | 'subtotal' | 'taxAmount' | 'totalAmount'>);
  }
  hideInvoiceDialog();
};

const confirmDeleteInvoice = (invoice: Invoice) => {
  invoiceToDelete.value = invoice;
  deleteInvoiceDialogVisible.value = true;
};

const deleteConfirmedInvoice = () => {
  if (invoiceToDelete.value && invoiceToDelete.value.id) {
    invoiceStore.deleteInvoice(invoiceToDelete.value.id);
  }
  deleteInvoiceDialogVisible.value = false;
  invoiceToDelete.value = null;
};

const getCustomerName = (customerId: string): string => {
  const customer = customerStore.getCustomerById(customerId);
  return customer ? customer.name : 'Unknown Customer';
};

const formatCurrency = (value: number): string => {
  if (typeof value !== 'number') return '';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case 'Paid': return 'success';
    case 'Overdue': return 'error';
    case 'Sent': return 'info';
    case 'Draft': return 'warning';
    case 'Cancelled': return 'grey';
    default: return 'primary';
  }
};

onMounted(() => {
  invoiceStore.loadInvoices();
  customerStore.loadCustomers();
});
</script>

<style scoped>
.search-field {
  max-width: 300px;
}
</style> 
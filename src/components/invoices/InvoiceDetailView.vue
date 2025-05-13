<template>
  <div class="invoice-details">
    <v-row>
      <v-col cols="12" md="6">
        <h3 class="text-h6 mb-2">Invoice Information</h3>
        <v-list>
          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-file-document"></v-icon>
            </template>
            <template v-slot:default>
              <v-list-item-title>Invoice #{{ invoice.invoiceNumber }}</v-list-item-title>
            </template>
          </v-list-item>

          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-calendar"></v-icon>
            </template>
            <template v-slot:default>
              <v-list-item-title>Issue Date: {{ new Date(invoice.issueDate).toLocaleDateString() }}</v-list-item-title>
            </template>
          </v-list-item>

          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-calendar-clock"></v-icon>
            </template>
            <template v-slot:default>
              <v-list-item-title>Due Date: {{ new Date(invoice.dueDate).toLocaleDateString() }}</v-list-item-title>
            </template>
          </v-list-item>

          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-tag"></v-icon>
            </template>
            <template v-slot:default>
              <v-list-item-title>
                Status: 
                <v-chip
                  :color="getStatusColor(invoice.status)"
                  size="small"
                  class="ml-2"
                >
                  {{ invoice.status }}
                </v-chip>
              </v-list-item-title>
            </template>
          </v-list-item>
        </v-list>
      </v-col>

      <v-col cols="12" md="6">
        <h3 class="text-h6 mb-2">Customer Information</h3>
        <v-list>
          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-account"></v-icon>
            </template>
            <template v-slot:default>
              <v-list-item-title>{{ getCustomerName(invoice.customerId) }}</v-list-item-title>
            </template>
          </v-list-item>

          <v-list-item v-if="customer?.email">
            <template v-slot:prepend>
              <v-icon icon="mdi-email"></v-icon>
            </template>
            <template v-slot:default>
              <v-list-item-title>{{ customer.email }}</v-list-item-title>
            </template>
          </v-list-item>

          <v-list-item v-if="customer?.phone">
            <template v-slot:prepend>
              <v-icon icon="mdi-phone"></v-icon>
            </template>
            <template v-slot:default>
              <v-list-item-title>{{ customer.phone }}</v-list-item-title>
            </template>
          </v-list-item>

          <v-list-item v-if="customer?.address">
            <template v-slot:prepend>
              <v-icon icon="mdi-map-marker"></v-icon>
            </template>
            <template v-slot:default>
              <v-list-item-title>
                {{ customer.address }}
                <br>
                {{ customer.city }}, {{ customer.state }} {{ customer.zipCode }}
              </v-list-item-title>
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <v-divider class="my-4"></v-divider>

    <h3 class="text-h6 mb-2">Invoice Items</h3>
    <v-table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in invoice.items" :key="item.productId">
          <td>{{ item.description }}</td>
          <td class="text-right">{{ item.quantity }}</td>
          <td class="text-right">{{ formatCurrency(item.unitPrice) }}</td>
          <td class="text-right">{{ formatCurrency(item.total) }}</td>
        </tr>
      </tbody>
    </v-table>

    <v-divider class="my-4"></v-divider>

    <v-row>
      <v-col cols="12" md="6" offset-md="6">
        <v-list>
          <v-list-item>
            <template v-slot:default>
              <v-list-item-title>Subtotal</v-list-item-title>
            </template>
            <template v-slot:append>
              {{ formatCurrency(invoice.subtotal) }}
            </template>
          </v-list-item>

          <template v-if="invoice.discountAmount > 0 || invoice.discountPercentage > 0">
            <v-list-item>
              <template v-slot:default>
                <v-list-item-title>Discount</v-list-item-title>
              </template>
              <template v-slot:append>
                -{{ formatCurrency(invoice.discountAmount > 0 ? invoice.discountAmount : (invoice.subtotal * invoice.discountPercentage / 100)) }}
                <span v-if="invoice.discountPercentage > 0"> ({{ invoice.discountPercentage }}%)</span>
              </template>
            </v-list-item>
          </template>

          <v-list-item v-if="invoice.taxAmount > 0">
            <template v-slot:default>
              <v-list-item-title>Tax ({{ invoice.taxRate }}%)</v-list-item-title>
            </template>
            <template v-slot:append>
              {{ formatCurrency(invoice.taxAmount) }}
            </template>
          </v-list-item>

          <v-divider class="my-2"></v-divider>

          <v-list-item>
            <template v-slot:default>
              <v-list-item-title class="font-weight-bold">Total Amount</v-list-item-title>
            </template>
            <template v-slot:append>
              <strong>{{ formatCurrency(invoice.totalAmount) }}</strong>
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <template v-if="invoice.notes || invoice.paymentTerms">
      <v-divider class="my-4"></v-divider>

      <v-row>
        <v-col cols="12" md="6" v-if="invoice.notes">
          <h3 class="text-h6 mb-2">Notes</h3>
          <p class="text-body-1">{{ invoice.notes }}</p>
        </v-col>

        <v-col cols="12" md="6" v-if="invoice.paymentTerms">
          <h3 class="text-h6 mb-2">Payment Terms</h3>
          <p class="text-body-1">{{ invoice.paymentTerms }}</p>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type Invoice } from '../../stores/invoices';
import { useCustomerStore } from '../../stores/customers';

interface Props {
  invoice: Invoice;
}

const props = defineProps<Props>();
const customerStore = useCustomerStore();

const customer = computed(() => customerStore.getCustomerById(props.invoice.customerId));

const getCustomerName = (customerId: string): string => {
  const customer = customerStore.getCustomerById(customerId);
  return customer ? customer.name : 'Unknown Customer';
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Paid': return 'success';
    case 'Overdue': return 'error';
    case 'Sent': return 'info';
    case 'Draft': return 'warning';
    case 'Cancelled': return 'grey';
    default: return 'primary';
  }
};
</script>

<style scoped>
.invoice-details {
  padding: 16px;
}
</style> 
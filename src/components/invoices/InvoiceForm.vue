<template>
  <form @submit.prevent="submitInvoice">
    <v-row>
      <v-col cols="12" md="6">
        <v-select
          v-model="formState.customerId"
          :items="customers"
          item-title="name"
          item-value="id"
          label="Customer"
          :error-messages="submitted && !formState.customerId ? 'Customer is required.' : ''"
          required
        ></v-select>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.invoiceNumber"
          label="Invoice Number"
          :error-messages="submitted && !formState.invoiceNumber ? 'Invoice number is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-menu
          v-model="issueDateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          min-width="auto"
        >
          <template v-slot:activator="{ props }">
            <v-text-field
              v-model="formState.issueDate"
              label="Issue Date"
              readonly
              v-bind="props"
              :error-messages="submitted && !formState.issueDate ? 'Issue date is required.' : ''"
              required
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="formState.issueDate"
            @update:model-value="issueDateMenu = false"
          ></v-date-picker>
        </v-menu>
      </v-col>

      <v-col cols="12" md="6">
        <v-menu
          v-model="dueDateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          min-width="auto"
        >
          <template v-slot:activator="{ props }">
            <v-text-field
              v-model="formState.dueDate"
              label="Due Date"
              readonly
              v-bind="props"
              :error-messages="submitted && !formState.dueDate ? 'Due date is required.' : ''"
              required
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="formState.dueDate"
            @update:model-value="dueDateMenu = false"
          ></v-date-picker>
        </v-menu>
      </v-col>

      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <span>Invoice Items</span>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="addItem"
            >
              Add Item
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-row v-for="(item, index) in formState.items" :key="index" class="mb-2">
              <v-col cols="12" md="4">
                <v-select
                  v-model="item.productId"
                  :items="products"
                  item-title="name"
                  item-value="id"
                  label="Product"
                  :error-messages="submitted && !item.productId ? 'Product is required.' : ''"
                  required
                  @update:model-value="updateItemProduct(index)"
                ></v-select>
              </v-col>

              <v-col cols="12" md="2">
                <v-text-field
                  v-model.number="item.quantity"
                  label="Quantity"
                  type="number"
                  :min="1"
                  :error-messages="submitted && !item.quantity ? 'Quantity is required.' : ''"
                  required
                  @update:model-value="updateItemTotal(index)"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="2">
                <v-text-field
                  v-model.number="item.unitPrice"
                  label="Unit Price"
                  type="number"
                  :min="0"
                  :step="0.01"
                  prefix="$"
                  :error-messages="submitted && !item.unitPrice ? 'Unit price is required.' : ''"
                  required
                  @update:model-value="updateItemTotal(index)"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="2">
                <v-text-field
                  v-model.number="item.total"
                  label="Total"
                  type="number"
                  readonly
                  prefix="$"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="2" class="d-flex align-center">
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  variant="text"
                  @click="removeItem(index)"
                ></v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.discountAmount"
          label="Discount Amount"
          type="number"
          :min="0"
          :step="0.01"
          prefix="$"
          @update:model-value="updateTotals"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.discountPercentage"
          label="Discount Percentage"
          type="number"
          :min="0"
          :max="100"
          suffix="%"
          @update:model-value="updateTotals"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.taxRate"
          label="Tax Rate"
          type="number"
          :min="0"
          :max="100"
          suffix="%"
          :error-messages="submitted && formState.taxRate === null ? 'Tax rate is required.' : ''"
          required
          @update:model-value="updateTotals"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.taxAmount"
          label="Tax Amount"
          type="number"
          readonly
          prefix="$"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.subtotal"
          label="Subtotal"
          type="number"
          readonly
          prefix="$"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="formState.totalAmount"
          label="Total Amount"
          type="number"
          readonly
          prefix="$"
        ></v-text-field>
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="formState.notes"
          label="Notes (Optional)"
          rows="3"
        ></v-textarea>
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="formState.paymentTerms"
          label="Payment Terms (Optional)"
          rows="2"
        ></v-textarea>
      </v-col>
    </v-row>

    <div class="d-flex justify-end gap-2 mt-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-close"
        @click="cancelInvoice"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-check"
        type="submit"
      >
        {{ isEdit ? 'Update Invoice' : 'Create Invoice' }}
      </v-btn>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { type Invoice, type InvoiceItem } from '../../stores/invoices';
import { type Customer } from '../../stores/customers';
import { type Product } from '../../stores/products';

interface InvoiceFormState {
  customerId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  notes?: string;
  paymentTerms?: string;
}

interface Props {
  invoice?: Invoice;
  customers: Customer[];
  products: Product[];
}

const props = withDefaults(defineProps<Props>(), {
  invoice: undefined,
  customers: () => [],
  products: () => []
});

const emit = defineEmits(['submit', 'cancel']);

const isEdit = !!props.invoice;
const issueDateMenu = ref(false);
const dueDateMenu = ref(false);
const submitted = ref(false);

const createEmptyItem = (): InvoiceItem => ({
  productId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0
});

const initialFormState: InvoiceFormState = {
  customerId: props.invoice?.customerId ?? '',
  invoiceNumber: props.invoice?.invoiceNumber ?? '',
  issueDate: props.invoice?.issueDate ?? new Date().toISOString().split('T')[0],
  dueDate: props.invoice?.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  items: props.invoice?.items ?? [createEmptyItem()],
  subtotal: props.invoice?.subtotal ?? 0,
  discountAmount: props.invoice?.discountAmount ?? 0,
  discountPercentage: props.invoice?.discountPercentage ?? 0,
  taxRate: props.invoice?.taxRate ?? 0,
  taxAmount: props.invoice?.taxAmount ?? 0,
  totalAmount: props.invoice?.totalAmount ?? 0,
  status: props.invoice?.status ?? 'Draft',
  notes: props.invoice?.notes ?? '',
  paymentTerms: props.invoice?.paymentTerms ?? ''
};

const formState = reactive<InvoiceFormState>({ ...initialFormState });

const updateItemProduct = (index: number) => {
  const item = formState.items[index];
  const product = props.products.find(p => p.id === item.productId);
  if (product) {
    item.description = product.name;
    item.unitPrice = product.sellingPrice;
    updateItemTotal(index);
  }
};

const updateItemTotal = (index: number) => {
  const item = formState.items[index];
  item.total = item.quantity * item.unitPrice;
  updateTotals();
};

const updateTotals = () => {
  // Calculate subtotal
  formState.subtotal = formState.items.reduce((sum, item) => sum + item.total, 0);

  // Apply discounts
  const discountAmount = formState.discountAmount;
  const discountPercentage = formState.discountPercentage;
  let discountedSubtotal = formState.subtotal;

  if (discountAmount > 0) {
    discountedSubtotal -= discountAmount;
  }
  if (discountPercentage > 0) {
    discountedSubtotal -= (formState.subtotal * discountPercentage) / 100;
  }

  // Calculate tax
  formState.taxAmount = (discountedSubtotal * formState.taxRate) / 100;

  // Calculate total
  formState.totalAmount = discountedSubtotal + formState.taxAmount;
};

const addItem = () => {
  formState.items.push(createEmptyItem());
};

const removeItem = (index: number) => {
  formState.items.splice(index, 1);
  updateTotals();
};

const validateForm = (): boolean => {
  if (!formState.customerId || !formState.invoiceNumber || !formState.issueDate || !formState.dueDate || formState.taxRate === null) {
    return false;
  }

  if (formState.items.length === 0) {
    return false;
  }

  for (const item of formState.items) {
    if (!item.productId || !item.quantity || !item.unitPrice) {
      return false;
    }
  }

  return true;
};

const submitInvoice = () => {
  submitted.value = true;
  if (!validateForm()) {
    return;
  }

  const invoiceToSave: Invoice = {
    id: props.invoice?.id ?? '',
    ...formState
  };

  emit('submit', invoiceToSave);
  resetForm();
};

const cancelInvoice = () => {
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
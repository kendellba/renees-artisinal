<template>
  <form @submit.prevent="submitPurchase">
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.supplier"
          label="Supplier"
          :error-messages="submitted && !formState.supplier ? 'Supplier is required.' : ''"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-menu
          v-model="dateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          min-width="auto"
        >
          <template v-slot:activator="{ props }">
            <v-text-field
              v-model="formState.date"
              label="Purchase Date"
              readonly
              v-bind="props"
              :error-messages="submitted && !formState.date ? 'Date is required.' : ''"
              required
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="formState.date"
            @update:model-value="dateMenu = false"
          ></v-date-picker>
        </v-menu>
      </v-col>

      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <span>Purchase Items</span>
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
                  v-model="item.itemName"
                  label="Item Name"
                  :error-messages="submitted && !item.itemName ? 'Item name is required.' : ''"
                  required
                ></v-text-field>
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

              <v-col cols="12" md="1">
                <v-text-field
                  v-model.number="item.totalCost"
                  label="Total"
                  type="number"
                  readonly
                  prefix="$"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="1" class="d-flex align-center">
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
          v-model.number="formState.totalAmount"
          label="Total Amount"
          type="number"
          readonly
          prefix="$"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="6">
        <v-select
          v-model="formState.paymentMethod"
          :items="paymentMethods"
          label="Payment Method"
          :error-messages="submitted && !formState.paymentMethod ? 'Payment method is required.' : ''"
          required
        ></v-select>
      </v-col>

      <v-col cols="12" md="6">
        <v-select
          v-model="formState.status"
          :items="statusOptions"
          label="Status"
          :error-messages="submitted && !formState.status ? 'Status is required.' : ''"
          required
        ></v-select>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="formState.invoiceReceiptNumber"
          label="Invoice/Receipt Number (Optional)"
        ></v-text-field>
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="formState.notes"
          label="Notes (Optional)"
          rows="3"
        ></v-textarea>
      </v-col>
    </v-row>

    <div class="d-flex justify-end gap-2 mt-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-close"
        @click="cancelPurchase"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-check"
        type="submit"
      >
        {{ isEdit ? 'Update Purchase' : 'Create Purchase' }}
      </v-btn>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { type Purchase, type PurchaseItem } from '../../stores/purchases';
import { type Product } from '../../stores/products';

interface PurchaseFormState {
  supplier: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
  status: 'pending' | 'completed' | 'cancelled';
  invoiceReceiptNumber?: string;
  notes?: string;
}

interface Props {
  purchase?: Purchase;
  products: Product[];
}

const props = withDefaults(defineProps<Props>(), {
  purchase: undefined,
  products: () => []
});

const emit = defineEmits(['submit', 'cancel']);

const isEdit = !!props.purchase;
const dateMenu = ref(false);
const submitted = ref(false);

const paymentMethods = [
  { title: 'Cash', value: 'Cash' },
  { title: 'Card', value: 'Card' },
  { title: 'Bank Transfer', value: 'Bank Transfer' },
  { title: 'Other', value: 'Other' }
];

const statusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' }
];

const createEmptyItem = (): PurchaseItem => ({
  productId: '',
  itemName: '',
  quantity: 1,
  unitPrice: 0,
  totalCost: 0
});

const initialFormState: PurchaseFormState = {
  supplier: props.purchase?.supplier ?? '',
  date: props.purchase?.date ?? new Date().toISOString().split('T')[0],
  items: props.purchase?.items ?? [createEmptyItem()],
  totalAmount: props.purchase?.totalAmount ?? 0,
  paymentMethod: (props.purchase?.paymentMethod as 'Cash' | 'Card' | 'Bank Transfer' | 'Other') ?? 'Cash',
  status: props.purchase?.status ?? 'pending',
  invoiceReceiptNumber: props.purchase?.invoiceReceiptNumber ?? '',
  notes: props.purchase?.notes ?? ''
};

const formState = reactive<PurchaseFormState>({ ...initialFormState });

const updateItemProduct = (index: number) => {
  const item = formState.items[index];
  const product = props.products.find(p => p.id === item.productId);
  if (product) {
    item.itemName = product.name;
    item.unitPrice = product.purchasePrice ?? product.cost;
    updateItemTotal(index);
  }
};

const updateItemTotal = (index: number) => {
  const item = formState.items[index];
  item.totalCost = item.quantity * item.unitPrice;
  updateTotalAmount();
};

const updateTotalAmount = () => {
  formState.totalAmount = formState.items.reduce((sum: number, item: PurchaseItem) => sum + item.totalCost, 0);
};

const addItem = () => {
  formState.items.push(createEmptyItem());
};

const removeItem = (index: number) => {
  formState.items.splice(index, 1);
  updateTotalAmount();
};

const validateForm = (): boolean => {
  if (!formState.supplier || !formState.date || !formState.paymentMethod || !formState.status) {
    return false;
  }

  if (formState.items.length === 0) {
    return false;
  }

  for (const item of formState.items) {
    if (!item.productId || !item.itemName || !item.quantity || !item.unitPrice) {
      return false;
    }
  }

  return true;
};

const submitPurchase = () => {
  submitted.value = true;
  if (!validateForm()) {
    return;
  }

  const purchaseToSave: Purchase = {
    id: props.purchase?.id ?? '',
    ...formState
  };

  emit('submit', purchaseToSave);
  resetForm();
};

const cancelPurchase = () => {
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
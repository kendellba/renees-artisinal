<template>
  <div class="purchase-management pa-4">
    <v-card class="mb-4">
      <v-card-actions>
        <v-btn color="success" prepend-icon="mdi-plus" @click="openNewPurchaseDialog">
          New Purchase/Expense
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card>
      <v-data-table
        :items="purchases"
        :items-per-page="10"
        :headers="headers"
        class="elevation-1"
      >
        <template v-slot:item.date="{ item }">
          {{ new Date(item.raw.date).toLocaleDateString() }}
        </template>

        <template v-slot:item.supplier="{ item }">
          {{ item.raw.supplier || 'N/A' }}
        </template>

        <template v-slot:item.items="{ item }">
          <ul>
            <li v-for="(purchaseItem, index) in item.raw.items" :key="index">
              {{ purchaseItem.itemName }} (x{{ purchaseItem.quantity }}) @ {{ formatCurrency(purchaseItem.unitPrice) }}
            </li>
          </ul>
        </template>

        <template v-slot:item.totalAmount="{ item }">
          {{ formatCurrency(item.raw.totalAmount) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            color="info"
            variant="text"
            size="small"
            class="mr-2"
            @click="editPurchase(item.raw)"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            color="error"
            variant="text"
            size="small"
            @click="confirmDeletePurchase(item.raw)"
          ></v-btn>
        </template>

        <template v-slot:no-data>
          No purchases or expenses found.
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Purchase Dialog -->
    <v-dialog v-model="purchaseDialogVisible" max-width="600px">
      <v-card>
        <v-card-title>
          Purchase/Expense Details
        </v-card-title>
        <v-card-text>
          <PurchaseForm :purchaseData="selectedPurchase" :products="products" @save="onPurchaseSave" @cancel="hidePurchaseDialog" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete Purchase Confirmation Dialog -->
    <v-dialog v-model="deletePurchaseDialogVisible" max-width="450px">
      <v-card>
        <v-card-title class="text-h5">
          Confirm Delete
        </v-card-title>
        <v-card-text class="d-flex align-center">
          <v-icon icon="mdi-alert" color="warning" size="large" class="mr-3"></v-icon>
          <span v-if="selectedPurchase">
            Are you sure you want to delete this purchase record (Total: {{formatCurrency(selectedPurchase.totalAmount)}})?
          </span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deletePurchaseDialogVisible = false">
            No
          </v-btn>
          <v-btn color="error" variant="text" @click="deleteConfirmedPurchase">
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePurchasesStore, type Purchase } from '../stores/purchases';
import { useProductsStore, type Product } from '../stores/products';
import PurchaseForm from '../components/purchases/PurchaseForm.vue';

const purchasesStore = usePurchasesStore();
const productsStore = useProductsStore();
const products = computed(() => productsStore.products);
const purchases = computed(() => 
  purchasesStore.purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
);

const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Supplier/Vendor', key: 'supplier', sortable: true },
  { title: 'Items/Description', key: 'items' },
  { title: 'Total Cost', key: 'totalAmount', sortable: true },
  { title: 'Payment Method', key: 'paymentMethod', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
];

const purchaseDialogVisible = ref(false);
const deletePurchaseDialogVisible = ref(false);
const selectedPurchase = ref<Purchase | null>(null);

const openNewPurchaseDialog = () => {
  selectedPurchase.value = null;
  purchaseDialogVisible.value = true;
};

const editPurchase = (purchase: Purchase) => {
  selectedPurchase.value = { ...purchase, items: purchase.items.map(item => ({...item})) }; // Deep copy for items
  purchaseDialogVisible.value = true;
};

const hidePurchaseDialog = () => {
  purchaseDialogVisible.value = false;
  selectedPurchase.value = null;
};

const onPurchaseSave = (purchase: Purchase) => {
  if (purchase.id) {
    purchasesStore.updatePurchase(purchase);
  } else {
    const { id, ...newPurchaseData } = purchase; // eslint-disable-line @typescript-eslint/no-unused-vars
    purchasesStore.addPurchase(newPurchaseData as Omit<Purchase, 'id' | 'date'>);
  }
  hidePurchaseDialog();
};

const confirmDeletePurchase = (purchase: Purchase) => {
  selectedPurchase.value = purchase;
  deletePurchaseDialogVisible.value = true;
};

const deleteConfirmedPurchase = () => {
  if (selectedPurchase.value && selectedPurchase.value.id) {
    purchasesStore.deletePurchase(selectedPurchase.value.id);
  }
  deletePurchaseDialogVisible.value = false;
  selectedPurchase.value = null;
};

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '$0.00';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

onMounted(() => {
  purchasesStore.loadPurchases();
  productsStore.loadProducts();
});
</script>

<style scoped>
ul {
  padding-left: 1.2em;
  margin: 0;
}
li {
  margin-bottom: 0.25rem;
}
</style> 
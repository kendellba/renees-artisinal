<template>
  <v-card class="sales-history pa-3">
    <v-card-title class="text-h5 mb-3">Sales Log</v-card-title>

    <v-card-text>
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-menu
            v-model="dateRangeMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            min-width="auto"
          >
            <template v-slot:activator="{ props }">
              <v-text-field
                v-model="dateRangeDisplay"
                label="Date Range"
                prepend-inner-icon="mdi-calendar"
                readonly
                v-bind="props"
                hide-details
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="dateRange"
              range
              @update:model-value="updateDateRangeDisplay"
            ></v-date-picker>
          </v-menu>
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="selectedProductFilter"
            :items="productListForFilter"
            item-title="name"
            item-value="id"
            label="Product"
            clearable
            hide-details
          ></v-select>
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="selectedPaymentFilter"
            :items="paymentMethodsForFilter"
            item-title="label"
            item-value="value"
            label="Payment Method"
            clearable
            hide-details
          ></v-select>
        </v-col>

        <v-col cols="12" md="2">
          <v-btn block variant="outlined" @click="clearFilters">
            <template v-slot:prepend>
              <v-icon icon="mdi-filter-remove"></v-icon>
            </template>
            Clear Filters
          </v-btn>
        </v-col>
      </v-row>

      <v-data-table
        :items="filteredSales"
        :items-per-page="10"
        :headers="headers"
        class="elevation-1"
      >
        <template v-slot:item.date="{ item }">
          {{ new Date(item.raw.date).toLocaleString() }}
        </template>

        <template v-slot:item.totalAmount="{ item }">
          {{ formatCurrency(item.raw.totalAmount) }}
        </template>

        <template v-slot:item.items="{ item }">
          {{ item.raw.items.length }} item(s)
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            @click="viewSaleDetails(item.raw)"
          >
            <template v-slot:icon>
              <v-icon icon="mdi-eye"></v-icon>
            </template>
          </v-btn>
        </template>

        <template v-slot:no-data>
          No sales found for the selected criteria.
        </template>
      </v-data-table>
    </v-card-text>

    <!-- Sale Details Dialog -->
    <v-dialog v-model="saleDetailsDialogVisible" max-width="500px">
      <v-card>
        <v-card-title>Sale Details</v-card-title>
        <v-card-text v-if="selectedSaleForView">
          <p><strong>Sale ID:</strong> {{ 
            typeof selectedSaleForView.id === 'number' 
              ? String(selectedSaleForView.id).substring(0,8) 
              : selectedSaleForView.id.substring(0,8) 
          }}</p>
          <p><strong>Date:</strong> {{ new Date(selectedSaleForView.date).toLocaleString() }}</p>
          <p><strong>Payment Method:</strong> {{ selectedSaleForView.paymentMethod }}</p>
          
          <v-divider class="my-3"></v-divider>
          
          <h5 class="text-h6 mb-2">Items Sold:</h5>
          <ul>
            <li v-for="item in selectedSaleForView.items" :key="item.productId">
              {{ item.productName }} (x{{ item.quantity }}) - {{ formatCurrency(item.pricePerUnit) }} each. Total: {{ formatCurrency(item.total) }}
            </li>
          </ul>
          
          <v-divider class="my-3"></v-divider>
          
          <v-row class="text-right">
            <v-col cols="9">Subtotal:</v-col>
            <v-col cols="3">{{ formatCurrency(selectedSaleForView.subtotal) }}</v-col>
            
            <template v-if="selectedSaleForView.discountAmount > 0 || selectedSaleForView.discountPercentage > 0">
              <v-col cols="9">Discount:</v-col>
              <v-col cols="3">
                -{{ formatCurrency(selectedSaleForView.discountAmount > 0 ? selectedSaleForView.discountAmount : (selectedSaleForView.subtotal * selectedSaleForView.discountPercentage / 100)) }}
                <span v-if="selectedSaleForView.discountPercentage > 0"> ({{selectedSaleForView.discountPercentage}}%)</span>
              </v-col>
            </template>

            <v-col cols="9" class="font-weight-bold">Total:</v-col>
            <v-col cols="3" class="font-weight-bold">{{ formatCurrency(selectedSaleForView.totalAmount) }}</v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="saleDetailsDialogVisible = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSalesStore, type Sale } from '../../stores/sales';
import { useProductsStore } from '../../stores/products';

const salesStore = useSalesStore();
const productsStore = useProductsStore();

const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Total Amount', key: 'totalAmount', sortable: true },
  { title: 'Payment Method', key: 'paymentMethod', sortable: true },
  { title: 'Items', key: 'items' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
];

const dateRange = ref<Date[]>([]);
const dateRangeMenu = ref(false);
const dateRangeDisplay = ref('');

const selectedProductFilter = ref<string | null>(null);
const selectedPaymentFilter = ref<string | null>(null);

const saleDetailsDialogVisible = ref(false);
const selectedSaleForView = ref<Sale | null>(null);

const productListForFilter = computed(() => {
  return [{ name: 'All Products', id: null }, ...productsStore.products.map(p => ({name: p.name, id: p.id}))];
});

const paymentMethodsForFilter = ref([
  { label: 'All Methods', value: null },
  { label: 'Cash', value: 'Cash' },
  { label: 'Card', value: 'Card' },
  { label: 'Other', value: 'Other' }
]);

const updateDateRangeDisplay = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    const start = new Date(dateRange.value[0]).toLocaleDateString();
    const end = new Date(dateRange.value[1]).toLocaleDateString();
    dateRangeDisplay.value = `${start} - ${end}`;
  } else {
    dateRangeDisplay.value = '';
  }
};

const filteredSales = computed(() => {
  let sales = salesStore.sales;

  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = new Date(dateRange.value[0]).setHours(0,0,0,0);
    const endDate = new Date(dateRange.value[1]).setHours(23,59,59,999);
    sales = sales.filter(sale => {
      const saleDate = new Date(sale.date).getTime();
      return saleDate >= startDate && saleDate <= endDate;
    });
  }

  if (selectedProductFilter.value) {
    sales = sales.filter(sale => sale.items.some(item => item.productId === selectedProductFilter.value));
  }

  if (selectedPaymentFilter.value) {
    sales = sales.filter(sale => sale.paymentMethod === selectedPaymentFilter.value);
  }

  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const viewSaleDetails = (sale: Sale) => {
  selectedSaleForView.value = sale;
  saleDetailsDialogVisible.value = true;
};

const clearFilters = () => {
  dateRange.value = [];
  dateRangeDisplay.value = '';
  selectedProductFilter.value = null;
  selectedPaymentFilter.value = null;
};

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

onMounted(() => {
  salesStore.loadSales();
  productsStore.loadProducts();
});
</script>

<style scoped>
.sales-history {
  height: 100%;
}
</style> 
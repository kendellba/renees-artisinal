<template>
  <div class="inventory-report">
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-item>
            <v-card-title>Date Range</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="dateRange.start"
                    label="Start Date"
                    type="date"
                    @update:model-value="$emit('update:date-range', dateRange)"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="dateRange.end"
                    label="End Date"
                    type="date"
                    @update:model-value="$emit('update:date-range', dateRange)"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-item>
            <v-card-title>Summary</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <div class="text-h6">Total Products</div>
                  <div class="text-h4">{{ totalProducts }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-h6">Low Stock Items</div>
                  <div class="text-h4">{{ lowStockCount }}</div>
                </v-col>
              </v-row>
              <v-row class="mt-4">
                <v-col cols="12">
                  <div class="text-h6">Total Stock Value</div>
                  <div class="text-h4">{{ formatCurrency(totalStockValue) }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-item>
            <v-card-title>Stock Levels</v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th class="text-right">Current Stock</th>
                    <th class="text-right">Min Stock</th>
                    <th class="text-right">Unit</th>
                    <th class="text-right">Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in products" :key="product.id">
                    <td>{{ product.name }}</td>
                    <td>{{ product.category }}</td>
                    <td class="text-right">{{ product.stock }}</td>
                    <td class="text-right">{{ product.minStock }}</td>
                    <td class="text-right">{{ product.unit }}</td>
                    <td class="text-right">{{ formatCurrency(product.stock * product.cost) }}</td>
                    <td>
                      <v-chip
                        :color="getStockStatusColor(product)"
                        size="small"
                      >
                        {{ getStockStatus(product) }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-item>
            <v-card-title>Stock Movements</v-card-title>
            <v-card-text>
              <div class="chart-container">
                <!-- TODO: Implement chart using a charting library -->
                <div class="placeholder-chart">
                  Stock movement chart will be displayed here
                </div>
              </div>
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-item>
            <v-card-title>Recent Stock Updates</v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th class="text-right">Quantity</th>
                    <th>Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="update in recentUpdates" :key="update.id">
                    <td>{{ formatDate(update.date) }}</td>
                    <td>{{ update.productName }}</td>
                    <td>{{ update.type }}</td>
                    <td class="text-right">{{ update.quantity }}</td>
                    <td>{{ update.updatedBy }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProductsStore } from '@/stores/products';

interface DateRange {
  start: string;
  end: string;
}

interface Props {
  dateRange: DateRange;
}

const props = defineProps<Props>();
const productsStore = useProductsStore();

// Load products when component is mounted
onMounted(async () => {
  await productsStore.fetchProducts();
});

const products = computed(() => productsStore.products);
const totalProducts = computed(() => productsStore.getTotalProducts);
const lowStockCount = computed(() => productsStore.getLowStockProducts.length);
const totalStockValue = computed(() => productsStore.getTotalStockValue);

// Mock data for recent updates - replace with actual data from store
const recentUpdates = ref([
  { id: 1, date: '2024-03-15', productName: 'Coffee Beans - Arabica', type: 'Restock', quantity: 20, updatedBy: 'John Doe' },
  { id: 2, date: '2024-03-14', productName: 'Milk - Whole', type: 'Restock', quantity: 15, updatedBy: 'Jane Smith' },
  { id: 3, date: '2024-03-13', productName: 'Sugar - White', type: 'Restock', quantity: 10, updatedBy: 'John Doe' },
  { id: 4, date: '2024-03-12', productName: 'Coffee Beans - Arabica', type: 'Usage', quantity: -5, updatedBy: 'Jane Smith' },
  { id: 5, date: '2024-03-11', productName: 'Milk - Whole', type: 'Usage', quantity: -8, updatedBy: 'John Doe' },
]);

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};

const getStockStatus = (product: any): string => {
  if (product.stock <= 0) return 'Out of Stock';
  if (product.stock <= product.minStock) return 'Low Stock';
  return 'In Stock';
};

const getStockStatusColor = (product: any): string => {
  if (product.stock <= 0) return 'error';
  if (product.stock <= product.minStock) return 'warning';
  return 'success';
};
</script>

<style scoped>
.inventory-report {
  padding: 16px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-chart {
  color: #666;
  font-style: italic;
}
</style> 
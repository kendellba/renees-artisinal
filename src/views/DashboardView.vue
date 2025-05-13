<template>
  <v-container fluid class="dashboard-view">
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">Dashboard</h1>
      </v-col>
    </v-row>

    <v-row>
      <!-- Sales Metrics -->
      <v-col cols="12" md="6" lg="3">
        <v-card class="metric-card bg-blue-lighten-4">
          <v-card-title>Today's Sales</v-card-title>
          <v-card-text>
            <p class="text-h4 font-weight-bold">{{ formatCurrency(salesStore.currentDaySalesTotal) }}</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="metric-card bg-green-lighten-4">
          <v-card-title>This Week's Sales</v-card-title>
          <v-card-text>
            <p class="text-h4 font-weight-bold">{{ formatCurrency(salesStore.currentWeekSalesTotal) }}</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="metric-card bg-orange-lighten-4">
          <v-card-title>This Month's Sales</v-card-title>
          <v-card-text>
            <p class="text-h4 font-weight-bold">{{ formatCurrency(salesStore.currentMonthSalesTotal) }}</p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Profit Metrics -->
      <v-col cols="12" md="6" lg="3">
        <v-card class="metric-card bg-purple-lighten-4">
          <v-card-title>Profit (Last 7 Days)</v-card-title>
          <v-card-text>
            <p class="text-h4 font-weight-bold">{{ formatCurrency(profitLast7Days) }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="6" lg="3">
        <v-card class="metric-card bg-pink-lighten-4">
          <v-card-title>Profit (Last 30 Days)</v-card-title>
          <v-card-text>
            <p class="text-h4 font-weight-bold">{{ formatCurrency(profitLast30Days) }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Inventory Overview -->
    <v-row class="mt-4">
      <v-col cols="12" lg="6">
        <v-card>
          <v-card-title>Top Selling Products (Last 30 Days)</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="topProductsHeaders"
              :items="topSellingProductsWithStock"
              :items-per-page="5"
            >
              <template v-slot:item.product.currentStockLevel="{ item }">
                <span :class="{'text-red': isLowStock(item.product)}">
                  {{ item.product.isInventoryTracked ? item.product.currentStockLevel : 'N/A' }}
                </span>
              </template>
              <template v-slot:no-data>
                No sales data available for top products.
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card>
          <v-card-title>Quick Links</v-card-title>
          <v-card-text>
            <v-row class="quick-links">
              <v-col cols="12" md="6" class="mb-2">
                <v-btn block color="primary" size="large" to="/sales">
                  New Sale
                </v-btn>
              </v-col>
              <v-col cols="12" md="6" class="mb-2">
                <v-btn block color="secondary" size="large" to="/products">
                  Manage Products
                </v-btn>
              </v-col>
              <v-col cols="12" md="6" class="mb-2">
                <v-btn block color="info" size="large" to="/inventory">
                  View Inventory
                </v-btn>
              </v-col>
              <v-col cols="12" md="6" class="mb-2">
                <v-btn block color="success" size="large" to="/reports">
                  View Reports
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Sales Analytics Charts -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            Sales Analytics
            <v-spacer></v-spacer>
            <v-select
              v-model="selectedPeriod"
              :items="periodOptions"
              label="Period"
              density="compact"
              variant="outlined"
              hide-details
              class="period-select"
              style="max-width: 150px"
            ></v-select>
          </v-card-title>
          <v-card-text>
            <SalesChart :period="selectedPeriod" :height="280" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Categories and Inventory Charts -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Product Categories</v-card-title>
          <v-card-text>
            <CategoryPieChart :height="280" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Inventory Levels</v-card-title>
          <v-card-text>
            <InventoryChart :height="280" :limit="8" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useSalesStore } from '../stores/sales';
import { useProductsStore, type Product } from '../stores/products';
import { useInventoryStore } from '../stores/inventory';
import SalesChart from '../components/charts/SalesChart.vue';
import CategoryPieChart from '../components/charts/CategoryPieChart.vue';
import InventoryChart from '../components/charts/InventoryChart.vue';

const salesStore = useSalesStore();
const productsStore = useProductsStore();
const inventoryStore = useInventoryStore();

// Period selection for sales chart
const selectedPeriod = ref<'day' | 'week' | 'month' | 'year'>('week');
const periodOptions = [
  { title: 'Day', value: 'day' },
  { title: 'Week', value: 'week' },
  { title: 'Month', value: 'month' },
  { title: 'Year', value: 'year' }
];

const topProductsHeaders = [
  { title: 'Product', key: 'product.name' },
  { title: 'Units Sold', key: 'quantitySold' },
  { title: 'Current Stock', key: 'product.currentStockLevel' }
];

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '$0.00';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Computed properties for dynamic data
const profitLast7Days = computed(() => salesStore.profitLastNDays(7));
const profitLast30Days = computed(() => salesStore.profitLastNDays(30));

const topSellingProductsWithStock = computed(() => {
  const topProducts = salesStore.topSellingProducts(5, 30); // Top 5 products in last 30 days
  return topProducts.map(item => {
    // Use productId instead of product.id
    const productDetails = productsStore.getProductById(item.productId);
    if (!productDetails) {
      return {
        ...item,
        product: {
          name: `Product #${item.productId}`,
          currentStockLevel: 'N/A',
          isInventoryTracked: false
        }
      };
    }
    return {
      ...item,
      product: productDetails
    };
  });
});

const isLowStock = (product: Product): boolean => {
  if (
    !product.isInventoryTracked ||
    product.currentStockLevel === null ||
    product.currentStockLevel === undefined
  ) {
    return false;
  }
  return product.currentStockLevel < inventoryStore.lowStockThreshold;
  // TODO: Consider product-specific low stock thresholds if implemented later
};

onMounted(() => {
  // Ensure stores are loaded - they should auto-load, but good for clarity or if issues arise
  salesStore.loadSales();
  productsStore.loadProducts();
  inventoryStore.loadInventoryData();
});
</script>

<style scoped>
.dashboard-view {
  width: 100%;
}

.metric-card .v-card-text {
  padding-top: 8px;
  padding-bottom: 8px;
}

.metric-card p {
  margin: 0;
}

.text-red {
  color: red;
}

.quick-links .v-btn {
  width: 100%;
}

/* Custom colors for cards */
.bg-blue-lighten-4 { background-color: rgb(207, 232, 252); }
.bg-green-lighten-4 { background-color: rgb(209, 250, 229); }
.bg-orange-lighten-4 { background-color: rgb(255, 237, 213); }
.bg-purple-lighten-4 { background-color: rgb(233, 213, 255); }
.bg-pink-lighten-4 { background-color: rgb(252, 231, 243); }

.period-select {
  margin-left: 8px;
}
</style> 
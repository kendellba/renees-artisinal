<template>
  <div class="sales-report">
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
                  <div class="text-h6">Total Sales</div>
                  <div class="text-h4">{{ formatCurrency(totalSales) }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-h6">Total Orders</div>
                  <div class="text-h4">{{ totalOrders }}</div>
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
            <v-card-title>Sales Trend</v-card-title>
            <v-card-text>
              <div class="chart-container">
                <!-- TODO: Implement chart using a charting library -->
                <div class="placeholder-chart">
                  Sales trend chart will be displayed here
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
            <v-card-title>Top Selling Products</v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="text-right">Units Sold</th>
                    <th class="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in topProducts" :key="product.id">
                    <td>{{ product.name }}</td>
                    <td class="text-right">{{ product.unitsSold }}</td>
                    <td class="text-right">{{ formatCurrency(product.revenue) }}</td>
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
import { ref, computed } from 'vue';
import { useSalesStore } from '@/stores/sales';

interface DateRange {
  start: string;
  end: string;
}

interface Props {
  dateRange: DateRange;
}

const props = defineProps<Props>();
const salesStore = useSalesStore();

// Mock data - replace with actual data from store
const totalSales = computed(() => 12500.00);
const totalOrders = computed(() => 150);
const topProducts = ref([
  { id: 1, name: 'Product A', unitsSold: 45, revenue: 2250.00 },
  { id: 2, name: 'Product B', unitsSold: 38, revenue: 1900.00 },
  { id: 3, name: 'Product C', unitsSold: 32, revenue: 1600.00 },
  { id: 4, name: 'Product D', unitsSold: 28, revenue: 1400.00 },
  { id: 5, name: 'Product E', unitsSold: 25, revenue: 1250.00 },
]);

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};
</script>

<style scoped>
.sales-report {
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
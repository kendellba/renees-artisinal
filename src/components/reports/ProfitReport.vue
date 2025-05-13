<template>
  <div class="profit-report">
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
                  <div class="text-h6">Total Revenue</div>
                  <div class="text-h4">{{ formatCurrency(totalRevenue) }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-h6">Total Profit</div>
                  <div class="text-h4">{{ formatCurrency(totalProfit) }}</div>
                </v-col>
              </v-row>
              <v-row class="mt-4">
                <v-col cols="12">
                  <div class="text-h6">Profit Margin</div>
                  <div class="text-h4">{{ profitMargin }}%</div>
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
            <v-card-title>Profit Trend</v-card-title>
            <v-card-text>
              <div class="chart-container">
                <!-- TODO: Implement chart using a charting library -->
                <div class="placeholder-chart">
                  Profit trend chart will be displayed here
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
            <v-card-title>Top Profitable Products</v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="text-right">Revenue</th>
                    <th class="text-right">Cost</th>
                    <th class="text-right">Profit</th>
                    <th class="text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in topProducts" :key="product.id">
                    <td>{{ product.name }}</td>
                    <td class="text-right">{{ formatCurrency(product.revenue) }}</td>
                    <td class="text-right">{{ formatCurrency(product.cost) }}</td>
                    <td class="text-right">{{ formatCurrency(product.profit) }}</td>
                    <td class="text-right">{{ product.margin }}%</td>
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
            <v-card-title>Expense Breakdown</v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th class="text-right">Amount</th>
                    <th class="text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="expense in expenseBreakdown" :key="expense.category">
                    <td>{{ expense.category }}</td>
                    <td class="text-right">{{ formatCurrency(expense.amount) }}</td>
                    <td class="text-right">{{ expense.percentage }}%</td>
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
import { usePurchasesStore } from '@/stores/purchases';

interface DateRange {
  start: string;
  end: string;
}

interface Props {
  dateRange: DateRange;
}

const props = defineProps<Props>();
const salesStore = useSalesStore();
const purchasesStore = usePurchasesStore();

// Mock data - replace with actual data from stores
const totalRevenue = computed(() => 25000.00);
const totalProfit = computed(() => 8750.00);
const profitMargin = computed(() => 35);

const topProducts = ref([
  { id: 1, name: 'Product A', revenue: 5000.00, cost: 3000.00, profit: 2000.00, margin: 40 },
  { id: 2, name: 'Product B', revenue: 4500.00, cost: 2700.00, profit: 1800.00, margin: 40 },
  { id: 3, name: 'Product C', revenue: 4000.00, cost: 2600.00, profit: 1400.00, margin: 35 },
  { id: 4, name: 'Product D', revenue: 3500.00, cost: 2450.00, profit: 1050.00, margin: 30 },
  { id: 5, name: 'Product E', revenue: 3000.00, cost: 2100.00, profit: 900.00, margin: 30 },
]);

const expenseBreakdown = ref([
  { category: 'Cost of Goods', amount: 12500.00, percentage: 50 },
  { category: 'Operating Expenses', amount: 2500.00, percentage: 10 },
  { category: 'Labor', amount: 5000.00, percentage: 20 },
  { category: 'Utilities', amount: 1000.00, percentage: 4 },
  { category: 'Rent', amount: 2000.00, percentage: 8 },
  { category: 'Other', amount: 2000.00, percentage: 8 },
]);

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};
</script>

<style scoped>
.profit-report {
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
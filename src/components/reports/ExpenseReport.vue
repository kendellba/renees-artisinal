<template>
  <div class="expense-report">
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
                  <div class="text-h6">Total Expenses</div>
                  <div class="text-h4">{{ formatCurrency(totalExpenses) }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-h6">Average Daily</div>
                  <div class="text-h4">{{ formatCurrency(averageDailyExpense) }}</div>
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
            <v-card-title>Expense Trend</v-card-title>
            <v-card-text>
              <div class="chart-container">
                <!-- TODO: Implement chart using a charting library -->
                <div class="placeholder-chart">
                  Expense trend chart will be displayed here
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
            <v-card-title>Expense Categories</v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th class="text-right">Amount</th>
                    <th class="text-right">% of Total</th>
                    <th class="text-right">Last Expense</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="category in expenseCategories" :key="category.name">
                    <td>{{ category.name }}</td>
                    <td class="text-right">{{ formatCurrency(category.amount) }}</td>
                    <td class="text-right">{{ category.percentage }}%</td>
                    <td class="text-right">{{ formatDate(category.lastExpense) }}</td>
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
            <v-card-title>Recent Expenses</v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th class="text-right">Amount</th>
                    <th>Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="expense in recentExpenses" :key="expense.id">
                    <td>{{ formatDate(expense.date) }}</td>
                    <td>{{ expense.description }}</td>
                    <td>{{ expense.category }}</td>
                    <td class="text-right">{{ formatCurrency(expense.amount) }}</td>
                    <td>{{ expense.paymentMethod }}</td>
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
import { usePurchasesStore } from '@/stores/purchases';

interface DateRange {
  start: string;
  end: string;
}

interface Props {
  dateRange: DateRange;
}

const props = defineProps<Props>();
const purchasesStore = usePurchasesStore();

// Mock data - replace with actual data from store
const totalExpenses = computed(() => 15000.00);
const averageDailyExpense = computed(() => 500.00);

const expenseCategories = ref([
  { name: 'Inventory', amount: 7500.00, percentage: 50, lastExpense: '2024-03-15' },
  { name: 'Utilities', amount: 1500.00, percentage: 10, lastExpense: '2024-03-14' },
  { name: 'Rent', amount: 3000.00, percentage: 20, lastExpense: '2024-03-01' },
  { name: 'Equipment', amount: 1500.00, percentage: 10, lastExpense: '2024-03-10' },
  { name: 'Other', amount: 1500.00, percentage: 10, lastExpense: '2024-03-12' },
]);

const recentExpenses = ref([
  { id: 1, date: '2024-03-15', description: 'Monthly inventory restock', category: 'Inventory', amount: 2500.00, paymentMethod: 'Credit Card' },
  { id: 2, date: '2024-03-14', description: 'Electricity bill', category: 'Utilities', amount: 500.00, paymentMethod: 'Bank Transfer' },
  { id: 3, date: '2024-03-12', description: 'Office supplies', category: 'Other', amount: 300.00, paymentMethod: 'Credit Card' },
  { id: 4, date: '2024-03-10', description: 'New coffee machine', category: 'Equipment', amount: 1200.00, paymentMethod: 'Bank Transfer' },
  { id: 5, date: '2024-03-01', description: 'Monthly rent', category: 'Rent', amount: 3000.00, paymentMethod: 'Bank Transfer' },
]);

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>
.expense-report {
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
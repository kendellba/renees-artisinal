<template>
  <v-container fluid class="reports-view">
    <h1 class="text-h4 mb-4">Reports and Analytics</h1>

    <!-- Report Type Selection -->
    <v-card class="mb-4">
      <v-card-text>
        <v-tabs v-model="selectedTab" bg-color="primary">
          <v-tab value="sales">Sales</v-tab>
          <v-tab value="inventory">Inventory</v-tab>
          <v-tab value="profits">Profits</v-tab>
          <v-tab value="customers">Customers</v-tab>
        </v-tabs>
      </v-card-text>
    </v-card>

    <!-- Date Range Selection -->
    <v-card class="mb-4">
      <v-card-title>Date Range</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="5" md="4" lg="3">
            <v-text-field
              v-model="dateRange.start"
              label="Start Date"
              type="date"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="5" md="4" lg="3">
            <v-text-field
              v-model="dateRange.end"
              label="End Date"
              type="date"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="2" md="4" lg="2" class="d-flex align-center">
            <v-btn color="primary" @click="applyDateRange" prepend-icon="mdi-filter">
              Apply
            </v-btn>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="12" sm="12" md="4" lg="4" class="d-flex align-center justify-end">
            <v-btn color="success" @click="exportReport" prepend-icon="mdi-download" class="mr-2">
              Export
            </v-btn>
            <v-btn color="info" @click="printReport" prepend-icon="mdi-printer">
              Print
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Sales Report Tab -->
    <v-window v-model="selectedTab">
      <v-window-item value="sales">
        <v-row>
          <v-col cols="12" lg="8">
            <v-card>
              <v-card-title class="d-flex align-center">
                Sales Trend
                <v-spacer></v-spacer>
                <v-select
                  v-model="salesPeriod"
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
                <SalesChart :period="salesPeriod" :height="350" />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" lg="4">
            <v-card>
              <v-card-title>Sales Summary</v-card-title>
              <v-card-text>
                <div class="d-flex flex-column gap-4">
                  <div class="summary-item">
                    <div class="text-subtitle-1">Total Sales</div>
                    <div class="text-h4">{{ formatCurrency(salesSummary.totalSales) }}</div>
                  </div>
                  <div class="summary-item">
                    <div class="text-subtitle-1">Total Orders</div>
                    <div class="text-h4">{{ salesSummary.totalOrders }}</div>
                  </div>
                  <div class="summary-item">
                    <div class="text-subtitle-1">Average Order Value</div>
                    <div class="text-h4">{{ formatCurrency(salesSummary.avgOrderValue) }}</div>
                  </div>
                  <div class="summary-item">
                    <div class="text-subtitle-1">Total Items Sold</div>
                    <div class="text-h4">{{ salesSummary.totalItems }}</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title>Top Selling Products</v-card-title>
              <v-card-text>
                <v-table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th class="text-right">Units Sold</th>
                      <th class="text-right">Revenue</th>
                      <th class="text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="product in topProducts" :key="product.id">
                      <td>{{ product.name }}</td>
                      <td class="text-right">{{ product.unitsSold }}</td>
                      <td class="text-right">{{ formatCurrency(product.revenue) }}</td>
                      <td class="text-right">{{ formatPercent(product.percentOfTotal) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Inventory Report Tab -->
      <v-window-item value="inventory">
        <v-row>
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Product Categories</v-card-title>
              <v-card-text>
                <CategoryPieChart :height="350" />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Inventory Levels</v-card-title>
              <v-card-text>
                <InventoryChart :height="350" :limit="10" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title>Inventory Summary</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="3">
                    <div class="summary-item">
                      <div class="text-subtitle-1">Total Products</div>
                      <div class="text-h4">{{ inventorySummary.totalProducts }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="summary-item">
                      <div class="text-subtitle-1">Low Stock Items</div>
                      <div class="text-h4 text-error">{{ inventorySummary.lowStockItems }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="summary-item">
                      <div class="text-subtitle-1">Out of Stock Items</div>
                      <div class="text-h4 text-error">{{ inventorySummary.outOfStockItems }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="summary-item">
                      <div class="text-subtitle-1">Total Inventory Value</div>
                      <div class="text-h4">{{ formatCurrency(inventorySummary.totalValue) }}</div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Profits Report Tab -->
      <v-window-item value="profits">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Profit Margin by Product</v-card-title>
              <v-card-text style="height: 400px">
                <v-data-table
                  :headers="profitHeaders"
                  :items="profitByProduct"
                  :items-per-page="10"
                >
                  <template v-slot:item.profitMargin="{ item }">
                    <v-progress-linear
                      :model-value="item.profitMargin"
                      :color="getProfitMarginColor(item.profitMargin)"
                      height="20"
                      striped
                    >
                      <template v-slot:default>
                        {{ formatPercent(item.profitMargin) }}
                      </template>
                    </v-progress-linear>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Profit Summary</v-card-title>
              <v-card-text>
                <div class="d-flex flex-column gap-4">
                  <div class="summary-item">
                    <div class="text-subtitle-1">Total Revenue</div>
                    <div class="text-h4">{{ formatCurrency(profitSummary.totalRevenue) }}</div>
                  </div>
                  <div class="summary-item">
                    <div class="text-subtitle-1">Total Cost</div>
                    <div class="text-h4">{{ formatCurrency(profitSummary.totalCost) }}</div>
                  </div>
                  <div class="summary-item">
                    <div class="text-subtitle-1">Net Profit</div>
                    <div class="text-h4 text-success">{{ formatCurrency(profitSummary.netProfit) }}</div>
                  </div>
                  <div class="summary-item">
                    <div class="text-subtitle-1">Profit Margin</div>
                    <div class="text-h4">{{ formatPercent(profitSummary.profitMargin) }}</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Most Profitable Products</v-card-title>
              <v-card-text>
                <v-table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th class="text-right">Profit</th>
                      <th class="text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="product in mostProfitableProducts" :key="product.id">
                      <td>{{ product.name }}</td>
                      <td class="text-right">{{ formatCurrency(product.profit) }}</td>
                      <td class="text-right">{{ formatPercent(product.profitMargin) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Customers Report Tab -->
      <v-window-item value="customers">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Customer Summary</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="3">
                    <div class="summary-item">
                      <div class="text-subtitle-1">Total Customers</div>
                      <div class="text-h4">{{ customerSummary.totalCustomers }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="summary-item">
                      <div class="text-subtitle-1">New Customers</div>
                      <div class="text-h4 text-success">{{ customerSummary.newCustomers }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="summary-item">
                      <div class="text-subtitle-1">Repeat Customers</div>
                      <div class="text-h4">{{ customerSummary.repeatCustomers }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="summary-item">
                      <div class="text-subtitle-1">Avg Value per Customer</div>
                      <div class="text-h4">{{ formatCurrency(customerSummary.avgOrderValue) }}</div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title>Top Customers</v-card-title>
              <v-card-text>
                <v-data-table
                  :headers="customerHeaders"
                  :items="topCustomers"
                  :items-per-page="10"
                >
                  <template v-slot:item.totalSpent="{ item }">
                    {{ formatCurrency(item.totalSpent) }}
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SalesChart from '@/components/charts/SalesChart.vue';
import CategoryPieChart from '@/components/charts/CategoryPieChart.vue';
import InventoryChart from '@/components/charts/InventoryChart.vue';
import { useSalesStore } from '@/stores/sales';
import { useProductsStore } from '@/stores/products';
import { useInventoryStore } from '@/stores/inventory';
import { useCustomerStore } from '@/stores/customers';

// Stores
const salesStore = useSalesStore();
const productsStore = useProductsStore();
const inventoryStore = useInventoryStore();
const customerStore = useCustomerStore();

// Tab selection
const selectedTab = ref('sales');

// Date range selection
const dateRange = ref({
  start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
});

// Period selection for sales chart
const salesPeriod = ref<'day' | 'week' | 'month' | 'year'>('month');
const periodOptions = [
  { title: 'Day', value: 'day' },
  { title: 'Week', value: 'week' },
  { title: 'Month', value: 'month' },
  { title: 'Year', value: 'year' }
];

// Profit headers
const profitHeaders = [
  { title: 'Product', key: 'name' },
  { title: 'Revenue', key: 'revenue', align: 'end' },
  { title: 'Cost', key: 'cost', align: 'end' },
  { title: 'Profit', key: 'profit', align: 'end' },
  { title: 'Margin', key: 'profitMargin', align: 'end' }
];

// Customer headers
const customerHeaders = [
  { title: 'Customer', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Orders', key: 'orderCount', align: 'end' },
  { title: 'Total Spent', key: 'totalSpent', align: 'end' },
  { title: 'Last Order', key: 'lastOrderDate' }
];

// Format currency
const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Format percentage
const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Get color for profit margin
const getProfitMarginColor = (margin: number): string => {
  if (margin < 15) return 'error';
  if (margin < 30) return 'warning';
  if (margin < 50) return 'info';
  return 'success';
};

// Apply date range
const applyDateRange = () => {
  // Refresh data based on date range
  console.log('Applying date range:', dateRange.value);
  // Implement actual data loading based on date range
};

// Export report
const exportReport = () => {
  console.log('Exporting', selectedTab.value, 'report');
  // Implement export functionality
};

// Print report
const printReport = () => {
  console.log('Printing', selectedTab.value, 'report');
  window.print();
};

// Mock data - replace with actual data from stores
// Sales summary data
const salesSummary = computed(() => ({
  totalSales: salesStore.totalSales || 12500,
  totalOrders: salesStore.totalOrders || 150,
  avgOrderValue: salesStore.avgOrderValue || 83.33,
  totalItems: salesStore.totalItemsSold || 450
}));

// Top selling products
const topProducts = computed(() => {
  // Get real data from salesStore if available
  const realTopProducts = salesStore.topSellingProducts ? 
    salesStore.topSellingProducts(10, 30) : [];
  
  if (realTopProducts.length > 0) {
    return realTopProducts.map(product => ({
      id: product.productId,
      name: product.name || productsStore.getProductById(product.productId)?.name || `Product #${product.productId}`,
      unitsSold: product.quantitySold,
      revenue: product.revenue,
      percentOfTotal: (product.revenue / salesSummary.value.totalSales) * 100
    }));
  }

  // Mock data as fallback
  return [
    { id: 1, name: 'Espresso', unitsSold: 352, revenue: 1760, percentOfTotal: 14.1 },
    { id: 2, name: 'Cappuccino', unitsSold: 285, revenue: 1425, percentOfTotal: 11.4 },
    { id: 3, name: 'Latte', unitsSold: 240, revenue: 1200, percentOfTotal: 9.6 },
    { id: 4, name: 'Mocha', unitsSold: 198, revenue: 990, percentOfTotal: 7.9 },
    { id: 5, name: 'Croissant', unitsSold: 175, revenue: 700, percentOfTotal: 5.6 }
  ];
});

// Inventory summary
const inventorySummary = computed(() => {
  const products = productsStore.products;
  const trackedProducts = products.filter(p => p.isInventoryTracked);
  const lowStockThreshold = inventoryStore.lowStockThreshold || 5;
  
  return {
    totalProducts: products.length,
    lowStockItems: trackedProducts.filter(p => 
      p.currentStockLevel && p.currentStockLevel <= lowStockThreshold && p.currentStockLevel > 0
    ).length,
    outOfStockItems: trackedProducts.filter(p => 
      p.currentStockLevel === 0 || p.currentStockLevel === null
    ).length,
    totalValue: trackedProducts.reduce((sum, product) => {
      const stock = product.currentStockLevel || 0;
      const cost = product.cost || 0;
      return sum + (stock * cost);
    }, 0)
  };
});

// Profit by product
const profitByProduct = computed(() => {
  const products = productsStore.products;
  
  return products.map(product => {
    const revenue = product.price;
    const cost = product.cost || (product.price * 0.4); // Default 40% cost if not provided
    const profit = revenue - cost;
    const profitMargin = (profit / revenue) * 100;
    
    return {
      id: product.id,
      name: product.name,
      revenue: revenue,
      cost: cost,
      profit: profit,
      profitMargin: profitMargin
    };
  }).sort((a, b) => b.profitMargin - a.profitMargin);
});

// Most profitable products
const mostProfitableProducts = computed(() => {
  return profitByProduct.value.slice(0, 5);
});

// Profit summary
const profitSummary = computed(() => {
  const sales = salesStore.sales || [];
  
  // Calculate total revenue
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  
  // Calculate total cost (estimated)
  const totalCost = sales.reduce((sum, sale) => {
    // Estimate cost based on products sold
    const costEstimate = sale.items ? sale.items.reduce((itemSum, item) => {
      const product = productsStore.getProductById(item.productId);
      const cost = product ? product.cost : (item.price * 0.4); // Default 40% cost
      return itemSum + (cost * item.quantity);
    }, 0) : (sale.totalAmount * 0.4); // Default 40% cost
    
    return sum + costEstimate;
  }, 0);
  
  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  return {
    totalRevenue,
    totalCost,
    netProfit,
    profitMargin
  };
});

// Customer summary
const customerSummary = computed(() => {
  const customers = customerStore.customers || [];
  const dateStart = new Date(dateRange.value.start);
  
  // Count new customers (registered after start date)
  const newCustomers = customers.filter(customer => {
    if (!customer.registrationDate) return false;
    const regDate = new Date(customer.registrationDate);
    return regDate >= dateStart;
  }).length;
  
  // Calculate average order value
  const totalRevenue = salesSummary.value.totalSales;
  const totalCustomers = customers.length || 1; // Avoid division by zero
  
  return {
    totalCustomers,
    newCustomers,
    repeatCustomers: totalCustomers - newCustomers,
    avgOrderValue: totalRevenue / totalCustomers
  };
});

// Top customers
const topCustomers = computed(() => {
  const customers = customerStore.customers || [];
  const sales = salesStore.sales || [];
  
  // Create customer spending summary
  const customerSpending: Record<string, { 
    totalSpent: number, 
    orderCount: number,
    lastOrderDate: string
  }> = {};
  
  // Calculate spending per customer
  sales.forEach(sale => {
    if (!sale.customerId) return;
    
    if (!customerSpending[sale.customerId]) {
      customerSpending[sale.customerId] = {
        totalSpent: 0,
        orderCount: 0,
        lastOrderDate: sale.date || ''
      };
    }
    
    customerSpending[sale.customerId].totalSpent += (sale.totalAmount || 0);
    customerSpending[sale.customerId].orderCount += 1;
    
    // Update last order date if this order is newer
    if (sale.date) {
      const currentLastDate = customerSpending[sale.customerId].lastOrderDate;
      if (!currentLastDate || new Date(sale.date) > new Date(currentLastDate)) {
        customerSpending[sale.customerId].lastOrderDate = sale.date;
      }
    }
  });
  
  // Join with customer details and sort by total spent
  return customers.map(customer => {
    const spending = customerSpending[customer.id.toString()] || { 
      totalSpent: 0, 
      orderCount: 0,
      lastOrderDate: ''
    };
    
    return {
      id: customer.id,
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email,
      email: customer.email,
      orderCount: spending.orderCount,
      totalSpent: spending.totalSpent,
      lastOrderDate: spending.lastOrderDate
    };
  })
  .sort((a, b) => b.totalSpent - a.totalSpent)
  .slice(0, 10);
});

// Load data
onMounted(() => {
  salesStore.loadSales();
  productsStore.loadProducts();
  inventoryStore.loadInventoryData();
  customerStore.loadCustomers();
});
</script>

<style scoped>
.reports-view {
  padding: 16px;
}

.summary-item {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.03);
}

.text-error {
  color: #f44336;
}

.text-success {
  color: #4caf50;
}

.period-select {
  width: 120px;
}

@media print {
  .v-tabs, .v-btn {
    display: none !important;
  }
  
  .v-card {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}
</style> 
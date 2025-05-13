<template>
  <div class="chart-container">
    <Line
      v-if="loaded"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useSalesStore } from '@/stores/sales';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Props
interface Props {
  period: 'day' | 'week' | 'month' | 'year';
  title?: string;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  period: 'week',
  title: 'Sales Overview',
  height: 250
});

// Data
const loaded = ref(false);
const salesStore = useSalesStore();

// Generate time periods based on selected period
const generateTimePeriods = () => {
  const periods = [];
  const today = new Date();
  
  switch (props.period) {
    case 'day':
      // Last 24 hours by hour
      for (let i = 23; i >= 0; i--) {
        const date = new Date(today);
        date.setHours(today.getHours() - i);
        periods.push(date.toLocaleTimeString('en-US', { hour: '2-digit' }));
      }
      break;
    case 'week':
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        periods.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }
      break;
    case 'month':
      // Last 30 days by week
      for (let i = 4; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - (i * 7));
        periods.push(`Week ${5-i}`);
      }
      break;
    case 'year':
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        periods.push(date.toLocaleDateString('en-US', { month: 'short' }));
      }
      break;
  }
  
  return periods;
};

// Generate random sales data based on period (to be replaced with actual data)
const generateSalesData = () => {
  // Get actual sales data from store based on period
  const salesData = [];
  const periods = generateTimePeriods();
  
  // Fallback function to generate random data when store methods are missing
  const generateRandomData = (min = 500, max = 5000) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  switch (props.period) {
    case 'day':
      // Get hourly sales for today
      for (let i = 0; i < periods.length; i++) {
        // Check if the method exists, otherwise use fallback
        salesData.push(
          typeof salesStore.getHourlySales === 'function' 
            ? salesStore.getHourlySales(i) 
            : generateRandomData(100, 1000)
        );
      }
      break;
    case 'week':
      // Get daily sales for past week
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        // Check if the method exists, otherwise use fallback
        salesData.push(
          typeof salesStore.getDailySales === 'function' 
            ? salesStore.getDailySales(date) 
            : generateRandomData(1000, 5000)
        );
      }
      break;
    case 'month':
      // Get weekly sales for past month
      for (let i = 4; i >= 0; i--) {
        // Check if the method exists, otherwise use fallback
        salesData.push(
          typeof salesStore.getWeeklySales === 'function' 
            ? salesStore.getWeeklySales(i) 
            : generateRandomData(5000, 15000)
        );
      }
      break;
    case 'year':
      // Get monthly sales for past year
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        // Check if the method exists, otherwise use fallback
        salesData.push(
          typeof salesStore.getMonthlySales === 'function' 
            ? salesStore.getMonthlySales(date) 
            : generateRandomData(10000, 50000)
        );
      }
      break;
  }
  
  return salesData;
};

// Chart data
const chartData = computed(() => ({
  labels: generateTimePeriods(),
  datasets: [
    {
      label: 'Sales',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 2,
      data: generateSalesData(),
      tension: 0.4
    }
  ]
}));

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const
    },
    title: {
      display: !!props.title,
      text: props.title
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: number) => {
          return '$' + value.toLocaleString();
        }
      }
    }
  }
}));

// Load chart after mount to avoid SSR issues
onMounted(() => {
  loaded.value = true;
});

// Watch for period changes to update chart
watch(() => props.period, () => {
  loaded.value = false;
  setTimeout(() => {
    loaded.value = true;
  }, 0);
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: v-bind('`${props.height}px`');
  width: 100%;
}
</style> 
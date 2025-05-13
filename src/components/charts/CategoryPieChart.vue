<template>
  <div class="chart-container">
    <Pie
      v-if="loaded"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useProductsStore } from '@/stores/products';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Props
interface Props {
  title?: string;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Product Categories',
  height: 250
});

// Data
const loaded = ref(false);
const productsStore = useProductsStore();

// Get product categories and count
const getCategoryData = () => {
  const categories: Record<string, number> = {};
  
  // Group products by category
  productsStore.products.forEach(product => {
    const category = product.category || 'Uncategorized';
    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category]++;
  });
  
  return {
    labels: Object.keys(categories),
    data: Object.values(categories)
  };
};

// Generate colors for categories
const generateColors = (count: number) => {
  const backgroundColors = [];
  const borderColors = [];
  
  // Predefined colors for common categories
  const colorPalette = [
    { bg: 'rgba(255, 99, 132, 0.6)', border: 'rgb(255, 99, 132)' },
    { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgb(54, 162, 235)' },
    { bg: 'rgba(255, 206, 86, 0.6)', border: 'rgb(255, 206, 86)' },
    { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgb(75, 192, 192)' },
    { bg: 'rgba(153, 102, 255, 0.6)', border: 'rgb(153, 102, 255)' },
    { bg: 'rgba(255, 159, 64, 0.6)', border: 'rgb(255, 159, 64)' },
    { bg: 'rgba(199, 199, 199, 0.6)', border: 'rgb(199, 199, 199)' },
    { bg: 'rgba(83, 102, 255, 0.6)', border: 'rgb(83, 102, 255)' },
    { bg: 'rgba(255, 99, 255, 0.6)', border: 'rgb(255, 99, 255)' },
    { bg: 'rgba(99, 255, 132, 0.6)', border: 'rgb(99, 255, 132)' }
  ];
  
  // Use predefined colors or generate random ones if we have more categories
  for (let i = 0; i < count; i++) {
    if (i < colorPalette.length) {
      backgroundColors.push(colorPalette[i].bg);
      borderColors.push(colorPalette[i].border);
    } else {
      // Generate random color
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      backgroundColors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
      borderColors.push(`rgb(${r}, ${g}, ${b})`);
    }
  }
  
  return { backgroundColors, borderColors };
};

// Chart data
const chartData = computed(() => {
  const { labels, data } = getCategoryData();
  const { backgroundColors, borderColors } = generateColors(labels.length);
  
  return {
    labels,
    datasets: [
      {
        label: 'Products',
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        data
      }
    ]
  };
});

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'right' as const
    },
    title: {
      display: !!props.title,
      text: props.title
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  }
}));

// Load chart after mount
onMounted(() => {
  loaded.value = true;
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: v-bind('`${props.height}px`');
  width: 100%;
}
</style> 
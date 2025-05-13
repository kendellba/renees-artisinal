<template>
  <div class="chart-container">
    <Bar 
      v-if="loaded"
      :data="chartData"
      :options="chartOptions"
      :plugins="plugins"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useProductsStore } from '@/stores/products';
import { useInventoryStore } from '@/stores/inventory';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Props
interface Props {
  title?: string;
  height?: number;
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Inventory Levels',
  height: 250,
  limit: 10 // Limit the number of products shown
});

// Data
const loaded = ref(false);
const productsStore = useProductsStore();
const inventoryStore = useInventoryStore();

// Get inventory data for products
const getInventoryData = () => {
  // Filter products with inventory tracking enabled and sort by stock level
  const productsWithInventory = productsStore.products
    .filter(product => product.isInventoryTracked)
    .sort((a, b) => {
      const aStock = a.currentStockLevel || 0;
      const bStock = b.currentStockLevel || 0;
      return aStock - bStock; // Sort by stock level (lowest first)
    })
    .slice(0, props.limit); // Limit to specified number of products
  
  const labels = productsWithInventory.map(product => product.name);
  const stockLevels = productsWithInventory.map(product => product.currentStockLevel || 0);
  const minStockLevels = productsWithInventory.map(product => {
    // Get minimum stock level (product-specific or global)
    return product.minStock || inventoryStore.lowStockThreshold || 5;
  });
  
  return { labels, stockLevels, minStockLevels };
};

// Chart data
const chartData = computed(() => {
  const { labels, stockLevels } = getInventoryData();
  
  return {
    labels,
    datasets: [
      {
        label: 'Current Stock',
        backgroundColor: stockLevels.map(level => 
          level < (inventoryStore.lowStockThreshold || 5) 
            ? 'rgba(255, 99, 132, 0.6)' 
            : 'rgba(75, 192, 192, 0.6)'
        ),
        borderColor: stockLevels.map(level => 
          level < (inventoryStore.lowStockThreshold || 5) 
            ? 'rgb(255, 99, 132)' 
            : 'rgb(75, 192, 192)'
        ),
        borderWidth: 1,
        data: stockLevels
      }
    ]
  };
});

// Custom plugin to draw minimum stock level line
const plugins = [
  {
    id: 'minStockLine',
    beforeDraw(chart: any) {
      const { ctx, chartArea, scales } = chart;
      const lowStockThreshold = inventoryStore.lowStockThreshold || 5;
      
      if (!chartArea) return;
      
      // Draw line at min stock level
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgb(255, 159, 64)';
      ctx.lineWidth = 2;
      
      const lineY = scales.y.getPixelForValue(lowStockThreshold);
      ctx.moveTo(chartArea.left, lineY);
      ctx.lineTo(chartArea.right, lineY);
      ctx.stroke();
      
      // Add label
      ctx.fillStyle = 'rgb(255, 159, 64)';
      ctx.textAlign = 'right';
      ctx.fillText('Min Stock Level', chartArea.right - 5, lineY - 5);
      
      ctx.restore();
    }
  }
];

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const, // Horizontal bar chart
  plugins: {
    legend: {
      display: true,
      position: 'top' as const
    },
    title: {
      display: !!props.title,
      text: props.title
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const label = context.dataset.label || '';
          const value = context.raw || 0;
          return `${label}: ${value} units`;
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Units'
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
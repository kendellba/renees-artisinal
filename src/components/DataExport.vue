<template>
  <v-btn @click="exportData" color="primary" :loading="exporting">
    Export Data
  </v-btn>
</template>

<script setup>
import { ref } from 'vue';
import { useProductsStore } from '../stores/products';
import { useSalesStore } from '../stores/sales';

const exporting = ref(false);

const exportData = async () => {
  exporting.value = true;
  const productsStore = useProductsStore();
  const salesStore = useSalesStore();
  
  try {
    // Get data
    const products = productsStore.products;
    const sales = salesStore.sales;
    
    // Convert to CSV
    const productsCSV = convertToCSV(products);
    const salesCSV = convertToCSV(sales);
    
    // Create download links
    downloadCSV(productsCSV, 'products.csv');
    downloadCSV(salesCSV, 'sales.csv');
  } finally {
    exporting.value = false;
  }
};

const convertToCSV = (data) => {
  if (!data || !data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      return `"${val?.toString().replace(/"/g, '""') || ''}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="receipt-container">
    <div class="receipt-header">
      <h2 class="receipt-title text-center">{{ businessName }}</h2>
      <p class="text-center">{{ businessAddress }}</p>
      <p class="text-center">{{ businessPhone }}</p>
      <p class="text-center text-caption">{{ new Date(sale.date).toLocaleString() }}</p>
      <p class="text-center">Order #{{ formatOrderNumber(sale.id) }}</p>
    </div>

    <v-divider class="my-2"></v-divider>

    <div v-if="customer" class="customer-info pa-2 rounded mb-2">
      <div class="d-flex align-center">
        <v-icon icon="mdi-account" size="small" class="mr-2"></v-icon>
        <span>{{ customer.name }}</span>
      </div>
      <div v-if="customer.email" class="text-caption">{{ customer.email }}</div>
      <div v-if="showLoyalty && customer.loyaltyPoints" class="mt-1 loyalty-info">
        <v-icon icon="mdi-star" color="amber" size="small" class="mr-1"></v-icon>
        <span>{{ customer.loyaltyTier }} Member ({{ customer.loyaltyPoints }} pts)</span>
      </div>
    </div>

    <div class="items-section">
      <div class="text-subtitle-1 font-weight-bold mb-1">Items</div>
      <div v-for="(item, index) in sale.items" :key="index" class="item-row mb-1">
        <div class="d-flex justify-space-between">
          <div>
            <div>{{ item.productName }} x {{ item.quantity }}</div>
            <div class="text-caption" v-if="item.notes">Note: {{ item.notes }}</div>
          </div>
          <div>{{ formatCurrency(item.total) }}</div>
        </div>
      </div>
    </div>

    <v-divider class="my-2"></v-divider>

    <div class="totals-section">
      <div class="d-flex justify-space-between mb-1">
        <span>Subtotal:</span>
        <span>{{ formatCurrency(sale.subtotal) }}</span>
      </div>
      
      <div v-if="sale.discountAmount > 0 || sale.discountPercentage > 0" class="d-flex justify-space-between mb-1">
        <span>Discount:</span>
        <span>
          <span v-if="sale.discountAmount > 0">{{ formatCurrency(sale.discountAmount) }}</span>
          <span v-else-if="sale.discountPercentage > 0">({{ sale.discountPercentage }}%)</span>
        </span>
      </div>
      
      <div v-if="sale.tax" class="d-flex justify-space-between mb-1">
        <span>Tax:</span>
        <span>{{ formatCurrency(sale.tax) }}</span>
      </div>
      
      <div v-if="sale.tipAmount" class="d-flex justify-space-between mb-1">
        <span>Tip:</span>
        <span>{{ formatCurrency(sale.tipAmount) }}</span>
      </div>
      
      <div class="d-flex justify-space-between font-weight-bold total-row">
        <span>Total:</span>
        <span>{{ formatCurrency(sale.totalAmount) }}</span>
      </div>
    </div>

    <div v-if="sale.payments && sale.payments.length > 0" class="payment-section mt-2">
      <div class="text-subtitle-2 font-weight-bold">Payment Details</div>
      <div v-for="(payment, index) in sale.payments" :key="index" class="d-flex justify-space-between payment-row">
        <span>{{ payment.method }}:</span>
        <span>{{ formatCurrency(payment.amount) }}</span>
      </div>
      <div v-if="calculateChange() > 0" class="d-flex justify-space-between mt-1">
        <span>Change:</span>
        <span>{{ formatCurrency(calculateChange()) }}</span>
      </div>
    </div>

    <div v-if="showLoyalty && loyaltyPointsEarned > 0" class="loyalty-section mt-3 pa-2 bg-grey-lighten-4 rounded">
      <div class="d-flex align-center mb-1">
        <v-icon icon="mdi-star" color="amber" class="mr-2" size="small"></v-icon>
        <strong>Points Earned: {{ loyaltyPointsEarned }}</strong>
      </div>
      <div class="text-caption" v-if="customer">
        {{ customer.name }} now has {{ customer.loyaltyPoints }} total points
      </div>
    </div>

    <div class="footer-section mt-3 text-center">
      <p v-if="customMessage" class="custom-message font-italic">{{ customMessage }}</p>
      <p class="text-caption mt-2">{{ businessTagline }}</p>
      <div v-if="showBarcode" class="barcode-container text-center mt-2">
        <p class="text-caption">{{ formatOrderNumber(sale.id) }}</p>
      </div>
    </div>

    <div class="receipt-actions mt-3" v-if="!printMode">
      <v-btn block prepend-icon="mdi-printer" @click="printReceipt" color="primary">
        Print Receipt
      </v-btn>
      <v-btn block prepend-icon="mdi-email-outline" @click="$emit('email-receipt')" class="mt-2" variant="outlined">
        Email Receipt
      </v-btn>
      <v-btn block prepend-icon="mdi-message-text-outline" @click="$emit('sms-receipt')" class="mt-2" variant="outlined">
        Text Receipt
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { type Sale } from '../../stores/sales';
import { type Customer } from '../../stores/customers';
import { useSettingsStore } from '../../stores/settings';

interface Props {
  sale: Sale;
  customer: Customer | null;
  loyaltyPointsEarned?: number;
  showLoyalty?: boolean;
  customMessage?: string;
  showBarcode?: boolean;
  printMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loyaltyPointsEarned: 0,
  showLoyalty: true,
  customMessage: '',
  showBarcode: true,
  printMode: false
});

const emit = defineEmits(['email-receipt', 'sms-receipt', 'print-complete']);

const settingsStore = useSettingsStore();

// Business info from settings store
const businessName = computed(() => settingsStore.business.name);
const businessAddress = computed(() => settingsStore.business.address);
const businessPhone = computed(() => settingsStore.business.phone);
const businessTagline = computed(() => settingsStore.business.receiptTagline);
const showBarcode = computed(() => settingsStore.receiptSettings.showBarcode);
const defaultMessage = computed(() => settingsStore.receiptSettings.defaultMessage);

// Use default message from settings if no custom message provided
const customMessage = computed(() => props.customMessage || defaultMessage.value);

// Format currency with locale support
const formatCurrency = (value: number): string => {
  if (typeof value !== 'number') return '';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Format order number 
const formatOrderNumber = (id: string | number): string => {
  if (typeof id === 'number') {
    return `#${id.toString().padStart(4, '0')}`;
  }
  // If ID is a string (like a UUID), take the first 8 chars
  return `#${id.substring(0, 8)}`;
};

// Calculate change if total paid > sale amount
const calculateChange = (): number => {
  if (!props.sale.payments) return 0;
  
  const totalPaid = props.sale.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(0, totalPaid - props.sale.totalAmount);
};

// Print receipt handler
const printReceipt = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  // Generate print-friendly content
  const printContent = document.querySelector('.receipt-container')?.innerHTML;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${props.sale.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          width: 300px;
          margin: 0 auto;
          padding: 10px;
        }
        .receipt-title {
          font-size: 18px;
          font-weight: bold;
          margin: 5px 0;
        }
        .text-center {
          text-align: center;
        }
        .item-row, .payment-row {
          margin-bottom: 5px;
        }
        .total-row {
          font-weight: bold;
          margin-top: 5px;
        }
        .custom-message {
          font-style: italic;
        }
        hr {
          border: 1px dashed #ccc;
          margin: 10px 0;
        }
      </style>
    </head>
    <body onload="window.print(); window.setTimeout(window.close, 500)">
      ${printContent}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  emit('print-complete');
};
</script>

<style scoped>
.receipt-container {
  font-family: 'Arial', sans-serif;
  max-width: 300px;
  margin: 0 auto;
  padding: 10px;
}

.receipt-title {
  font-size: 1.2em;
  font-weight: bold;
}

.item-row, .payment-row {
  font-size: 0.9em;
}

.total-row {
  font-weight: bold;
  padding-top: 5px;
}

.loyalty-section {
  border-radius: 4px;
}

.barcode-container {
  border-top: 1px solid #ddd;
  padding-top: 10px;
}

.custom-message {
  font-style: italic;
  padding: 5px 0;
}

.loyalty-info {
  display: flex;
  align-items: center;
  font-size: 0.8em;
}

@media print {
  .receipt-actions {
    display: none;
  }
}
</style> 
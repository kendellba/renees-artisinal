<template>
  <v-container fluid class="sales-management">
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">Sales Management</h1>
      </v-col>
    </v-row>

    <v-tabs v-model="activeTab">
      <v-tab value="pos">Point of Sale</v-tab>
      <v-tab value="history">Sales History</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="pos">
        <v-row>
          <v-col cols="12" md="7">
            <ProductSelector @add-to-cart="addToCart" />
          </v-col>
          <v-col cols="12" md="5">
            <CustomerLoyalty 
              v-model:customer="selectedCustomer" 
              @apply-discount="applyLoyaltyDiscount" 
              class="mb-4"
            />
            
            <ShoppingCart 
              :cartItems="currentCart" 
              @update-quantity="updateCartItemQuantity"
              @remove-item="removeCartItem"
              @apply-discount="applyCartDiscount"
              @process-sale="showPaymentOptions = true"
            />
          </v-col>
        </v-row>
      </v-window-item>
      <v-window-item value="history">
        <SalesHistory />
      </v-window-item>
    </v-window>

    <v-dialog v-model="showPaymentOptions" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Checkout</span>
          <v-btn icon="mdi-close" variant="text" @click="showPaymentOptions = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <PaymentOptions
            :subtotal="calculateSubtotal()"
            :tax="calculateTax()"
            :discount="calculateDiscount()"
            @payment-processed="processSaleWithPayment"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="receiptDialogVisible" max-width="400">
      <v-card v-if="lastSale">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Sale Receipt</span>
          <v-btn icon="mdi-close" variant="text" @click="receiptDialogVisible = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <Receipt 
            :sale="lastSale"
            :customer="selectedCustomer"
            :loyaltyPointsEarned="loyaltyPointsEarned"
            @email-receipt="emailReceipt"
            @sms-receipt="smsReceipt"
            @print-complete="handlePrintComplete"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { type Product } from '../stores/products';
import { useSalesStore, type Sale, type SaleItem } from '../stores/sales';
import { useCustomerStore, type Customer } from '../stores/customers';

// Import child components
import ProductSelector from '../components/pos/ProductSelector.vue';
import ShoppingCart from '../components/pos/ShoppingCart.vue';
import SalesHistory from '../components/pos/SalesHistory.vue';
import CustomerLoyalty from '../components/pos/CustomerLoyalty.vue';
import PaymentOptions from '../components/pos/PaymentOptions.vue';
import Receipt from '../components/pos/Receipt.vue';

const salesStore = useSalesStore();
const customerStore = useCustomerStore();

interface CartItem extends SaleItem {
  stock: number | null;
  isInventoryTracked: boolean;
}

interface PaymentDetail {
  method: string;
  amount: number;
  details?: string;
}

// State variables
const activeTab = ref('pos');
const currentCart = ref<CartItem[]>([]);
const overallDiscountAmount = ref(0);
const overallDiscountPercentage = ref(0);
const receiptDialogVisible = ref(false);
const lastSale = ref<Sale | null>(null);
const showPaymentOptions = ref(false);
const selectedCustomer = ref<Customer | null>(null);
const loyaltyPointsEarned = ref(0);
const loyaltyDiscountApplied = ref(false);
const taxRate = ref(0.07); // 7% tax rate

// Product management functions
const addToCart = (product: Product) => {
  if (!product.isInventoryTracked || (product.currentStockLevel ?? 0) > 0) {
    const existingItem = currentCart.value.find(item => item.productId === product.id);
    if (existingItem) {
      if (!product.isInventoryTracked || (existingItem.quantity < (product.currentStockLevel ?? Infinity))) {
        existingItem.quantity++;
        existingItem.total = existingItem.quantity * existingItem.pricePerUnit;
      } else {
        // TODO: Show notification: Not enough stock
        console.warn("Not enough stock for", product.name);
      }
    } else {
      currentCart.value.push({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        pricePerUnit: product.sellingPrice ?? product.price,
        total: product.sellingPrice ?? product.price,
        stock: product.currentStockLevel ?? null,
        isInventoryTracked: product.isInventoryTracked ?? false
      });
    }
  } else {
    // TODO: Show notification: Product out of stock
     console.warn("Product out of stock:", product.name);
  }
};

const updateCartItemQuantity = ({ productId, quantity }: { productId: string, quantity: number }) => {
  const item = currentCart.value.find(i => i.productId === productId);
  if (item) {
    if (quantity <= 0) {
      removeCartItem(productId);
    } else if (!item.isInventoryTracked || quantity <= (item.stock ?? Infinity) ) {
      item.quantity = quantity;
      item.total = item.quantity * item.pricePerUnit;
    } else {
      // TODO: Notify user: not enough stock
      console.warn("Not enough stock to update quantity for", item.productName);
      // Optionally revert to max available stock
      item.quantity = item.stock ?? item.quantity; 
      item.total = item.quantity * item.pricePerUnit;
    }
  }
};

const removeCartItem = (productId: string) => {
  currentCart.value = currentCart.value.filter(item => item.productId !== productId);
};

// Discount management
const applyCartDiscount = ({ type, value }: { type: 'percentage' | 'fixed', value: number }) => {
  if (type === 'fixed') {
    overallDiscountAmount.value = value;
    overallDiscountPercentage.value = 0; // Clear percentage if fixed is applied
  } else if (type === 'percentage') {
    overallDiscountPercentage.value = value;
    overallDiscountAmount.value = 0; // Clear fixed if percentage is applied
  }
};

const applyLoyaltyDiscount = ({ type, value, source }: { type: 'percentage' | 'fixed', value: number, source: string }) => {
  applyCartDiscount({ type, value });
  
  if (source === 'loyalty') {
    loyaltyDiscountApplied.value = true;
  } else if (source === 'points' && selectedCustomer.value) {
    // Points redemption is handled by the loyalty component
  }
};

// Calculation functions
const calculateSubtotal = () => {
  return currentCart.value.reduce((sum, item) => sum + item.total, 0);
};

const calculateTax = () => {
  return +(calculateSubtotal() * taxRate.value).toFixed(2);
};

const calculateDiscount = () => {
  const subtotal = calculateSubtotal();
  if (overallDiscountAmount.value > 0) {
    return overallDiscountAmount.value;
  } else if (overallDiscountPercentage.value > 0) {
    return +(subtotal * overallDiscountPercentage.value / 100).toFixed(2);
  }
  return 0;
};

const calculateTotal = (subtotal: number, tax: number, discount: number, tip: number = 0) => {
  return Math.max(0, subtotal + tax - discount + tip);
};

// Payment processing
const processSaleWithPayment = async (paymentDetails: { 
  payments: PaymentDetail[],
  tipAmount: number,
  total: number 
}) => {
  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const discount = calculateDiscount();
  const tipAmount = paymentDetails.tipAmount;
  const totalAmount = calculateTotal(subtotal, tax, discount, tipAmount);
  
  const saleToRecord: Omit<Sale, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    items: currentCart.value.map(item => ({ 
        productId: item.productId, 
        productName: item.productName, 
        quantity: item.quantity, 
        pricePerUnit: item.pricePerUnit, 
        total: item.total 
    })),
    subtotal,
    tax,
    tipAmount,
    discountAmount: overallDiscountAmount.value,
    discountPercentage: overallDiscountPercentage.value,
    totalAmount,
    paymentMethod: getPaymentMethodsList(paymentDetails.payments),
    status: 'completed',
    customerId: selectedCustomer.value?.id,
    payments: paymentDetails.payments
  };

  await salesStore.addSale(saleToRecord);
  
  // If customer is selected, add loyalty points
  if (selectedCustomer.value) {
    const pointsEarned = await customerStore.addLoyaltyPoints(
      selectedCustomer.value.id, 
      totalAmount
    );
    loyaltyPointsEarned.value = pointsEarned;
    
    // Refresh customer data to get updated points and tier
    const updatedCustomer = customerStore.getCustomerById(selectedCustomer.value.id);
    if (updatedCustomer) {
      selectedCustomer.value = updatedCustomer;
    }
  }
  
  // Find the newly added sale to show on receipt
  const newSaleId = salesStore.sales[salesStore.sales.length -1].id;
  lastSale.value = salesStore.getSaleById(newSaleId) || null;
  
  // Show receipt and reset
  receiptDialogVisible.value = true;
  showPaymentOptions.value = false;
  resetCart();
};

const getPaymentMethodsList = (payments: PaymentDetail[]): string => {
  return payments.map(p => p.method).join(', ');
};

const getPaymentMethodsText = (): string => {
  if (!lastSale.value || !lastSale.value.payments) {
    return lastSale.value?.paymentMethod || '';
  }
  
  return lastSale.value.payments.map(p => p.method).join(', ');
};

const resetCart = () => {
  currentCart.value = [];
  overallDiscountAmount.value = 0;
  overallDiscountPercentage.value = 0;
  loyaltyDiscountApplied.value = false;
  loyaltyPointsEarned.value = 0;
};

const formatCurrency = (value: number | undefined | null): string => {
  if (typeof value !== 'number' || value === undefined || value === null) return '$0.00';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Function to handle receipt actions
const emailReceipt = () => {
  // Implement email functionality
  console.log('Emailing receipt to', selectedCustomer.value?.email);
  // TODO: Implement actual email sending
};

const smsReceipt = () => {
  // Implement SMS functionality
  console.log('Sending receipt via SMS to', selectedCustomer.value?.phone);
  // TODO: Implement actual SMS sending
};

const handlePrintComplete = () => {
  console.log('Receipt printed successfully');
};
</script>

<style scoped>
.sales-management {
  font-family: var(--font-family);
}
</style> 
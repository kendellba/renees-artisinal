<template>
  <div class="payment-options">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Payment</span>
        <v-chip
          v-if="totalRemaining <= 0"
          color="success"
          variant="elevated"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-check-circle"></v-icon>
          </template>
          Paid
        </v-chip>
      </v-card-title>

      <v-card-text>
        <div class="d-flex justify-space-between mb-4">
          <div>
            <div class="text-body-1">Total Due</div>
            <div class="text-h5">{{ formatCurrency(totalAmount) }}</div>
          </div>
          <div v-if="payments.length > 0" class="text-right">
            <div class="text-body-1">Remaining</div>
            <div class="text-h5" :class="{'text-success': totalRemaining <= 0, 'text-error': totalRemaining > 0}">
              {{ formatCurrency(totalRemaining) }}
            </div>
          </div>
        </div>

        <!-- Payment Methods Selector -->
        <div class="mb-4">
          <div class="d-flex mb-2 align-center">
            <div class="text-subtitle-1">Payment Method</div>
            <v-spacer></v-spacer>
            <v-switch
              v-model="splitPaymentEnabled"
              color="primary"
              hide-details
              label="Split Payment"
              density="compact"
              :disabled="payments.length > 0"
            ></v-switch>
          </div>

          <v-tabs v-model="activePaymentTab" color="primary" class="mb-3">
            <v-tab value="card">
              <template v-slot:default>
                <v-icon icon="mdi-credit-card" class="mr-2"></v-icon>
                Card
              </template>
            </v-tab>
            <v-tab value="cash">
              <template v-slot:default>
                <v-icon icon="mdi-cash" class="mr-2"></v-icon>
                Cash
              </template>
            </v-tab>
            <v-tab value="mobile">
              <template v-slot:default>
                <v-icon icon="mdi-cellphone" class="mr-2"></v-icon>
                Mobile
              </template>
            </v-tab>
            <v-tab value="gift">
              <template v-slot:default>
                <v-icon icon="mdi-gift" class="mr-2"></v-icon>
                Gift Card
              </template>
            </v-tab>
          </v-tabs>

          <v-window v-model="activePaymentTab">
            <!-- Card Payment -->
            <v-window-item value="card">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="cardPayment.cardNumber"
                    label="Card Number"
                    placeholder="•••• •••• •••• ••••"
                    :rules="[v => !!v || 'Card number is required']"
                    hide-details="auto"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model="cardPayment.expiryDate"
                    label="Expiry Date"
                    placeholder="MM/YY"
                    hide-details="auto"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model="cardPayment.cvv"
                    label="CVV"
                    placeholder="123"
                    type="password"
                    hide-details="auto"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <div class="d-flex justify-space-between align-center">
                <v-checkbox
                  v-model="cardPayment.saveCard"
                  label="Save card for future use"
                  hide-details
                  density="compact"
                ></v-checkbox>
                <div class="d-flex">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/visa/visa-original.svg" width="32" height="32" class="mr-1" />
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mastercard/mastercard-original.svg" width="32" height="32" class="mr-1" />
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" width="32" height="32" />
                </div>
              </div>
            </v-window-item>

            <!-- Cash Payment -->
            <v-window-item value="cash">
              <v-text-field
                v-model.number="cashPayment.amountTendered"
                label="Amount Tendered"
                type="number"
                :min="splitPaymentEnabled ? 0.01 : totalAmount"
                variant="outlined"
                density="compact"
                hide-details="auto"
                prefix="$"
                class="mb-2"
              ></v-text-field>
              
              <div v-if="cashPayment.amountTendered > 0" class="d-flex justify-space-between mt-3">
                <div class="text-subtitle-2">Change</div>
                <div class="text-subtitle-1">{{ formatCurrency(calculateChange()) }}</div>
              </div>
            </v-window-item>

            <!-- Mobile Payment -->
            <v-window-item value="mobile">
              <div class="d-flex flex-column align-center mb-4">
                <div class="text-subtitle-1 mb-3">Choose a mobile payment option</div>
                <div class="d-flex justify-space-between" style="width: 300px;">
                  <v-btn 
                    color="black" 
                    variant="outlined" 
                    prepend-icon="mdi-apple"
                    class="mx-1"
                    @click="selectMobilePayment('Apple Pay')"
                    :class="{'v-btn--active': mobilePayment.method === 'Apple Pay'}"
                  >
                    Apple Pay
                  </v-btn>
                  <v-btn 
                    color="primary" 
                    variant="outlined" 
                    prepend-icon="mdi-google"
                    class="mx-1"
                    @click="selectMobilePayment('Google Pay')"
                    :class="{'v-btn--active': mobilePayment.method === 'Google Pay'}"
                  >
                    Google Pay
                  </v-btn>
                </div>
              </div>

              <div v-if="mobilePayment.method" class="text-center">
                <v-icon icon="mdi-qrcode" size="120" class="mb-2"></v-icon>
                <div class="text-body-1">Scan with your mobile device</div>
                <div class="text-caption">Open {{ mobilePayment.method }} app and scan this code</div>
              </div>
            </v-window-item>

            <!-- Gift Card Payment -->
            <v-window-item value="gift">
              <v-text-field
                v-model="giftCardPayment.cardNumber"
                label="Gift Card Number"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-2"
              ></v-text-field>
              
              <v-text-field
                v-model="giftCardPayment.pin"
                label="PIN (if applicable)"
                type="password"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-2"
              ></v-text-field>
              
              <v-btn 
                block
                variant="outlined"
                class="mb-2"
                :loading="giftCardLoading"
                @click="checkGiftCardBalance"
              >
                Check Balance
              </v-btn>

              <div v-if="giftCardPayment.balance !== null" class="d-flex justify-space-between pa-3 bg-grey-lighten-4 rounded">
                <div class="text-body-2">Card Balance</div>
                <div class="text-subtitle-1">{{ formatCurrency(giftCardPayment.balance) }}</div>
              </div>
            </v-window-item>
          </v-window>
        </div>

        <!-- Applied Payments List -->
        <div v-if="payments.length > 0" class="mb-4">
          <div class="text-subtitle-1 mb-2">Applied Payments</div>
          <v-list density="compact" class="bg-grey-lighten-5 rounded">
            <v-list-item
              v-for="(payment, index) in payments"
              :key="index"
              :subtitle="payment.details || ''"
            >
              <template v-slot:prepend>
                <v-icon 
                  :icon="getPaymentIcon(payment.method)" 
                  color="primary"
                ></v-icon>
              </template>
              <template v-slot:default>
                <v-list-item-title>
                  {{ payment.method }}
                </v-list-item-title>
              </template>
              <template v-slot:append>
                <div class="d-flex align-center">
                  <div class="mr-2">{{ formatCurrency(payment.amount) }}</div>
                  <v-btn 
                    icon="mdi-delete" 
                    density="compact" 
                    variant="text" 
                    color="error"
                    @click="removePayment(index)"
                  ></v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <!-- Tipping Options -->
        <div class="mb-4">
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-subtitle-1">Add Tip</div>
            <v-switch
              v-model="tipEnabled"
              color="primary"
              hide-details
              label="Include Tip"
              density="compact"
            ></v-switch>
          </div>

          <div v-if="tipEnabled">
            <div class="d-flex mb-2">
              <v-btn-toggle
                v-model="selectedTipPercentage"
                mandatory
                class="w-100 mb-2"
              >
                <v-btn 
                  v-for="option in tipOptions" 
                  :key="option.percentage"
                  :value="option.percentage"
                  @click="setTipByPercentage(option.percentage)"
                >
                  {{ option.label }}
                </v-btn>
                <v-btn 
                  value="custom"
                  @click="setTipByPercentage('custom')"
                >
                  Custom
                </v-btn>
              </v-btn-toggle>
            </div>

            <v-text-field
              v-if="selectedTipPercentage === 'custom'"
              v-model.number="customTipAmount"
              label="Custom Tip Amount"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="compact"
              hide-details="auto"
              prefix="$"
              @update:model-value="updateTipAmount(customTipAmount)"
            ></v-text-field>

            <div class="d-flex justify-space-between mt-2">
              <div class="text-body-1">Tip Amount</div>
              <div class="text-body-1">{{ formatCurrency(tipAmount) }}</div>
            </div>
          </div>
        </div>

        <!-- Process Payment Button -->
        <v-btn
          block
          color="success"
          size="large"
          @click="processPayment"
          :loading="processing"
          :disabled="!canProcessPayment"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-cash-register"></v-icon>
          </template>
          {{ paymentButtonText }}
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const emit = defineEmits(['payment-processed']);

interface Props {
  subtotal: number;
  tax?: number;
  discount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  subtotal: 0,
  tax: 0,
  discount: 0
});

// State
const splitPaymentEnabled = ref(false);
const activePaymentTab = ref('card');
const tipEnabled = ref(false);
const selectedTipPercentage = ref<number | 'custom'>(15);
const customTipAmount = ref(0);
const tipAmount = ref(0);
const processing = ref(false);
const giftCardLoading = ref(false);

// Card Payment State
const cardPayment = ref({
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  saveCard: false
});

// Cash Payment State
const cashPayment = ref({
  amountTendered: 0
});

// Mobile Payment State
const mobilePayment = ref({
  method: '' as 'Apple Pay' | 'Google Pay' | '',
  confirmed: false
});

// Gift Card Payment State
const giftCardPayment = ref({
  cardNumber: '',
  pin: '',
  balance: null as number | null
});

// Applied Payments
interface Payment {
  method: 'Card' | 'Cash' | 'Apple Pay' | 'Google Pay' | 'Gift Card';
  amount: number;
  details?: string;
}

const payments = ref<Payment[]>([]);

// Tip Options
const tipOptions = [
  { percentage: 15, label: '15%' },
  { percentage: 18, label: '18%' },
  { percentage: 20, label: '20%' },
  { percentage: 25, label: '25%' }
];

// Computed Properties
const totalAmount = computed(() => {
  const baseAmount = props.subtotal + props.tax - props.discount;
  return tipEnabled.value ? baseAmount + tipAmount.value : baseAmount;
});

const totalRemaining = computed(() => {
  const paidAmount = payments.value.reduce((sum, payment) => sum + payment.amount, 0);
  return +(totalAmount.value - paidAmount).toFixed(2);
});

const canProcessPayment = computed(() => {
  if (payments.length === 0) {
    // For first payment
    switch (activePaymentTab.value) {
      case 'card':
        return cardPayment.value.cardNumber.length > 0;
      case 'cash':
        return cashPayment.value.amountTendered >= (splitPaymentEnabled.value ? 0.01 : totalAmount.value);
      case 'mobile':
        return mobilePayment.value.method !== '';
      case 'gift':
        return giftCardPayment.value.cardNumber && giftCardPayment.value.balance !== null && 
               giftCardPayment.value.balance > 0;
      default:
        return false;
    }
  }
  
  // If split payment with some already processed
  return totalRemaining.value > 0 || 
    (totalRemaining.value <= 0 && payments.value.length > 0);
});

const paymentButtonText = computed(() => {
  if (payments.value.length === 0) {
    return `Process Payment (${formatCurrency(totalAmount.value)})`;
  } else if (totalRemaining.value > 0) {
    return `Add Payment (${formatCurrency(totalRemaining.value)})`;
  } else {
    return 'Complete Transaction';
  }
});

// Watch for changes to update tip amount
watch(() => props.subtotal, (newVal) => {
  if (selectedTipPercentage.value !== 'custom') {
    tipAmount.value = +(newVal * (selectedTipPercentage.value as number) / 100).toFixed(2);
  }
});

// Methods
const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });
};

const calculateChange = (): number => {
  const paymentAmount = splitPaymentEnabled.value ? 
    Math.min(cashPayment.value.amountTendered, totalRemaining.value) : 
    cashPayment.value.amountTendered;
    
  return cashPayment.value.amountTendered - paymentAmount;
};

const selectMobilePayment = (method: 'Apple Pay' | 'Google Pay') => {
  mobilePayment.value.method = method;
  mobilePayment.value.confirmed = false;
};

const checkGiftCardBalance = async () => {
  if (!giftCardPayment.value.cardNumber) return;
  
  giftCardLoading.value = true;
  try {
    // Simulate API call to check gift card balance
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock balance - in a real app, this would come from an API
    giftCardPayment.value.balance = Math.floor(Math.random() * 100) + 20;
  } finally {
    giftCardLoading.value = false;
  }
};

const setTipByPercentage = (percentage: number | 'custom') => {
  selectedTipPercentage.value = percentage;
  
  if (percentage !== 'custom') {
    tipAmount.value = +(props.subtotal * percentage / 100).toFixed(2);
    customTipAmount.value = tipAmount.value;
  }
};

const updateTipAmount = (amount: number) => {
  tipAmount.value = +amount;
};

const getPaymentIcon = (method: Payment['method']): string => {
  switch (method) {
    case 'Card': return 'mdi-credit-card';
    case 'Cash': return 'mdi-cash';
    case 'Apple Pay': return 'mdi-apple';
    case 'Google Pay': return 'mdi-google';
    case 'Gift Card': return 'mdi-gift';
    default: return 'mdi-cash-multiple';
  }
};

const removePayment = (index: number) => {
  payments.value.splice(index, 1);
};

const getCurrentPaymentDetails = (): Payment | null => {
  let payment: Payment | null = null;
  
  switch (activePaymentTab.value) {
    case 'card':
      if (cardPayment.value.cardNumber) {
        const lastFour = cardPayment.value.cardNumber.slice(-4).padStart(4, '•');
        payment = {
          method: 'Card',
          amount: splitPaymentEnabled.value ? Math.min(totalRemaining.value, totalAmount.value) : totalAmount.value,
          details: `Card ending in ${lastFour}`
        };
      }
      break;
      
    case 'cash':
      if (cashPayment.value.amountTendered > 0) {
        const paymentAmount = splitPaymentEnabled.value ? 
          Math.min(cashPayment.value.amountTendered, totalRemaining.value) : 
          cashPayment.value.amountTendered;
          
        payment = {
          method: 'Cash',
          amount: paymentAmount,
          details: cashPayment.value.amountTendered > paymentAmount ? 
            `Change: ${formatCurrency(cashPayment.value.amountTendered - paymentAmount)}` : undefined
        };
      }
      break;
      
    case 'mobile':
      if (mobilePayment.value.method) {
        payment = {
          method: mobilePayment.value.method,
          amount: splitPaymentEnabled.value ? totalRemaining.value : totalAmount.value
        };
      }
      break;
      
    case 'gift':
      if (giftCardPayment.value.cardNumber && giftCardPayment.value.balance !== null) {
        const giftCardAmount = Math.min(
          giftCardPayment.value.balance,
          splitPaymentEnabled.value ? totalRemaining.value : totalAmount.value
        );
        
        payment = {
          method: 'Gift Card',
          amount: giftCardAmount,
          details: `Card: ${giftCardPayment.value.cardNumber.slice(0, 4)}...${giftCardPayment.value.cardNumber.slice(-4)}`
        };
      }
      break;
  }
  
  return payment;
};

const processPayment = async () => {
  // If all payments are processed, complete the transaction
  if (totalRemaining.value <= 0 && payments.value.length > 0) {
    processing.value = true;
    try {
      // Simulate API call to process payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Handle loyalty points, emit completed payment event
      emit('payment-processed', {
        payments: payments.value,
        tipAmount: tipAmount.value,
        total: totalAmount.value
      });
      
      // Reset form after payment
      resetForm();
    } finally {
      processing.value = false;
    }
    return;
  }
  
  // Get current payment details
  const paymentDetails = getCurrentPaymentDetails();
  if (!paymentDetails) return;
  
  processing.value = true;
  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add payment to the list
    payments.value.push(paymentDetails);
    
    // Reset specific form fields but keep split payment enabled
    if (activePaymentTab.value === 'card') {
      cardPayment.value = { cardNumber: '', expiryDate: '', cvv: '', saveCard: false };
    } else if (activePaymentTab.value === 'cash') {
      cashPayment.value = { amountTendered: 0 };
    } else if (activePaymentTab.value === 'mobile') {
      mobilePayment.value = { method: '', confirmed: false };
    } else if (activePaymentTab.value === 'gift') {
      giftCardPayment.value = { cardNumber: '', pin: '', balance: null };
    }
    
    // If payment is complete, emit event
    if (totalRemaining.value <= 0) {
      emit('payment-processed', {
        payments: payments.value,
        tipAmount: tipAmount.value,
        total: totalAmount.value
      });
      resetForm();
    }
  } finally {
    processing.value = false;
  }
};

const resetForm = () => {
  // Reset all form fields
  splitPaymentEnabled.value = false;
  tipEnabled.value = false;
  tipAmount.value = 0;
  selectedTipPercentage.value = 15;
  customTipAmount.value = 0;
  cardPayment.value = { cardNumber: '', expiryDate: '', cvv: '', saveCard: false };
  cashPayment.value = { amountTendered: 0 };
  mobilePayment.value = { method: '', confirmed: false };
  giftCardPayment.value = { cardNumber: '', pin: '', balance: null };
  payments.value = [];
  activePaymentTab.value = 'card';
};
</script>

<style scoped>
.w-100 {
  width: 100%;
}

.v-btn--active {
  background-color: var(--v-primary-lighten-4);
}
</style> 
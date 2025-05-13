<template>
  <v-card class="shopping-cart">
    <v-card-title>Current Order</v-card-title>
    <v-card-text>
      <div v-if="cartItems.length === 0" class="text-center text-grey my-4">
        Cart is empty.
      </div>
      <div v-else>
        <div class="cart-items-container mb-3">
          <v-list>
            <v-list-item v-for="item in cartItems" :key="item.productId" class="mb-2">
              <template v-slot:prepend>
                <div>
                  <div class="text-subtitle-1">{{ item.productName }}</div>
                  <div class="text-body-2 text-grey">{{ formatCurrency(item.pricePerUnit) }}</div>
                </div>
              </template>
              
              <template v-slot:default>
                <v-row align="center" class="my-1">
                  <v-col cols="7">
                    <div class="d-flex align-center">
                      <v-btn
                        size="small"
                        variant="text"
                        density="compact"
                        @click="decrementQuantity(String(item.productId))"
                        :disabled="item.quantity <= 1"
                      >
                        <template v-slot:icon>
                          <v-icon icon="mdi-minus"></v-icon>
                        </template>
                      </v-btn>
                      <v-text-field
                        v-model.number="item.quantity"
                        @update:model-value="(newVal: number | null | undefined) => updateQuantity(String(item.productId), newVal)"
                        type="number"
                        :min="1"
                        :max="item.isInventoryTracked ? item.stock : undefined"
                        density="compact"
                        class="mx-1"
                        style="width: 60px"
                        hide-details
                      ></v-text-field>
                      <v-btn
                        size="small"
                        variant="text"
                        density="compact"
                        @click="incrementQuantity(String(item.productId))"
                        :disabled="item.isInventoryTracked && item.quantity >= (item.stock ?? Infinity)"
                      >
                        <template v-slot:icon>
                          <v-icon icon="mdi-plus"></v-icon>
                        </template>
                      </v-btn>
                    </div>
                  </v-col>
                  <v-col cols="5" class="text-right">
                    <v-btn
                      color="error"
                      variant="text"
                      size="small"
                      @click="removeItem(String(item.productId))"
                    >
                      <template v-slot:prepend>
                        <v-icon icon="mdi-delete"></v-icon>
                      </template>
                    </v-btn>
                  </v-col>
                </v-row>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <v-divider class="mb-3"></v-divider>

        <div class="summary mb-3">
          <div class="d-flex justify-space-between mb-1">
            <span>Subtotal:</span>
            <span>{{ formatCurrency(subtotal) }}</span>
          </div>
          
          <div class="discount-section mb-2">
            <div class="d-flex justify-space-between align-center">
              <span>Discount:</span>
              <v-btn
                variant="text"
                size="small"
                @click="discountDialogVisible = true"
              >
                <template v-slot:prepend>
                  <v-icon icon="mdi-tag"></v-icon>
                </template>
                {{ appliedDiscountText || 'Apply' }}
              </v-btn>
            </div>
          </div>

          <div class="d-flex justify-space-between font-weight-bold text-h6">
            <span>Total:</span>
            <span>{{ formatCurrency(totalAfterDiscount) }}</span>
          </div>
        </div>

        <div class="payment-section">
          <label for="paymentMethod" class="d-block mb-1">Payment Method:</label>
          <v-btn-toggle
            v-model="selectedPaymentMethod"
            mandatory
            class="mb-3 w-100"
          >
            <v-btn value="Cash">Cash</v-btn>
            <v-btn value="Card">Card</v-btn>
            <v-btn value="Other">Other</v-btn>
          </v-btn-toggle>
          <v-btn
            block
            color="success"
            size="large"
            @click="processOrder"
            :disabled="cartItems.length === 0"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-check"></v-icon>
            </template>
            Process Sale
          </v-btn>
        </div>
      </div>
    </v-card-text>

    <!-- Discount Dialog -->
    <v-dialog v-model="discountDialogVisible" max-width="400">
      <v-card>
        <v-card-title>Apply Discount</v-card-title>
        <v-card-text>
          <label for="discountType" class="mb-2 d-block">Discount Type</label>
          <v-btn-toggle
            v-model="discountType"
            mandatory
            class="mb-3 w-100"
          >
            <v-btn value="percentage">Percentage</v-btn>
            <v-btn value="fixed">Fixed Amount</v-btn>
          </v-btn-toggle>
          
          <v-text-field
            v-model.number="discountValue"
            :label="discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'"
            type="number"
            :min="0"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="discountDialogVisible = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="confirmDiscount"
          >
            Apply
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { SaleItem } from '../../stores/sales'; // Assuming SaleItem is defined in sales store

interface CartItem extends SaleItem {
  stock: number | null; // Max available stock if tracked
  isInventoryTracked: boolean;
}

interface Props {
  cartItems: CartItem[];
}

const props = defineProps<Props>();
const emit = defineEmits(['update-quantity', 'remove-item', 'apply-discount', 'process-sale']);

const selectedPaymentMethod = ref('Cash');

// Discount related state
const discountDialogVisible = ref(false);
const discountType = ref<'percentage' | 'fixed'>('percentage');
const discountValue = ref<number | null>(null);
const appliedDiscountType = ref<'percentage' | 'fixed' | null>(null);
const appliedDiscountValue = ref<number>(0);

const subtotal = computed(() => {
  return props.cartItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
});

const totalAfterDiscount = computed(() => {
    let total = subtotal.value;
    if (appliedDiscountType.value === 'fixed' && appliedDiscountValue.value > 0) {
        total -= appliedDiscountValue.value;
    } else if (appliedDiscountType.value === 'percentage' && appliedDiscountValue.value > 0) {
        total -= (total * appliedDiscountValue.value / 100);
    }
    return Math.max(0, total); // Ensure total doesn't go below zero
});

const appliedDiscountText = computed(() => {
    if (appliedDiscountType.value === 'fixed' && appliedDiscountValue.value > 0) {
        return `${formatCurrency(appliedDiscountValue.value)} Off`;
    }
    if (appliedDiscountType.value === 'percentage' && appliedDiscountValue.value > 0) {
        return `${appliedDiscountValue.value}% Off`;
    }
    return null;
});

const decrementQuantity = (productId: string) => {
  const item = props.cartItems.find(i => i.productId === productId);
  if (item && item.quantity > 1) {
    emit('update-quantity', { productId, quantity: item.quantity - 1 });
  }
};

const incrementQuantity = (productId: string) => {
  const item = props.cartItems.find(i => i.productId === productId);
  if (item) {
    if (!item.isInventoryTracked || (item.stock !== null && item.quantity < item.stock)) {
        emit('update-quantity', { productId, quantity: item.quantity + 1 });
    }
  }
};

const updateQuantity = (productId: string, newQuantity: number | null | undefined) => {
  if (newQuantity !== null && newQuantity !== undefined) {
    emit('update-quantity', { productId, quantity: newQuantity });
  }
};

const removeItem = (productId: string) => {
  emit('remove-item', productId);
};

const confirmDiscount = () => {
    if (discountValue.value !== null && discountValue.value >= 0) {
        appliedDiscountType.value = discountType.value;
        appliedDiscountValue.value = discountValue.value;
        emit('apply-discount', { type: discountType.value, value: discountValue.value });
    }
    discountDialogVisible.value = false;
    // Reset dialog values for next time
    discountType.value = 'percentage';
    discountValue.value = null;
};

const processOrder = () => {
  emit('process-sale', selectedPaymentMethod.value);
  // Reset applied discount after processing sale
  appliedDiscountType.value = null;
  appliedDiscountValue.value = 0;
};

const formatCurrency = (value: number) => {
  if (typeof value !== 'number') return '';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Watch for cart changes to reset discount if cart becomes empty
watch(() => props.cartItems, (newCart) => {
    if (newCart.length === 0) {
        appliedDiscountType.value = null;
        appliedDiscountValue.value = 0;
        emit('apply-discount', { type: 'fixed', value: 0 }); // Inform parent to reset discount too
    }
}, {deep: true});
</script>

<style scoped>
.shopping-cart {
  height: 100%;
}

.cart-items-container {
  max-height: 500px;
  overflow-y: auto;
}

.w-100 {
  width: 100%;
}
</style> 
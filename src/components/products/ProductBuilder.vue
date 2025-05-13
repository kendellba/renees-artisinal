<template>
  <div class="product-builder">
    <h2 class="text-h5 mb-4">{{ isEdit ? 'Edit' : 'Create' }} Product with Recipe</h2>
    
    <v-form @submit.prevent="submitForm">
      <v-container>
        <!-- Basic Product Information -->
        <v-card class="mb-4">
          <v-card-title>Basic Information</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formState.name"
                  label="Product Name"
                  :rules="[(v: string) => !!v || 'Product name is required']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="formState.category"
                  :items="categoryOptions"
                  label="Category"
                  :rules="[(v: string) => !!v || 'Category is required']"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="formState.description"
                  label="Description"
                  rows="2"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <!-- Ingredients List -->
        <v-card class="mb-4">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Ingredients</span>
            <v-btn
              color="primary"
              size="small"
              prepend-icon="mdi-plus"
              @click="addIngredient"
            >
              Add Ingredient
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <div v-if="ingredients.length === 0" class="text-center pa-4 text-grey">
              No ingredients added yet. Add ingredients to calculate the product cost.
            </div>
            
            <div v-for="(ingredient, index) in ingredients" :key="index" class="ingredient-row mb-3">
              <v-row align="center">
                <v-col cols="12" md="4">
                  <v-autocomplete
                    v-model="ingredient.productId"
                    :items="availableIngredients"
                    item-title="name"
                    item-value="id"
                    label="Ingredient"
                    :rules="[(v: any) => !!v || 'Ingredient is required']"
                    @update:model-value="updateIngredientDetails(index)"
                    return-object
                  ></v-autocomplete>
                </v-col>
                
                <v-col cols="6" md="2">
                  <v-text-field
                    v-model.number="ingredient.quantity"
                    label="Quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    :rules="[(v: number) => v > 0 || 'Quantity must be greater than 0']"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="6" md="2">
                  <v-text-field
                    v-model="ingredient.unit"
                    label="Unit"
                    disabled
                  ></v-text-field>
                </v-col>
                
                <v-col cols="6" md="2">
                  <v-text-field
                    v-model="ingredient.unitCost"
                    label="Unit Cost"
                    prefix="$"
                    disabled
                  ></v-text-field>
                </v-col>
                
                <v-col cols="5" md="1">
                  <v-text-field
                    :model-value="calculateIngredientCost(ingredient)"
                    label="Total"
                    prefix="$"
                    disabled
                  ></v-text-field>
                </v-col>
                
                <v-col cols="1" class="d-flex align-center justify-center">
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeIngredient(index)"
                  ></v-btn>
                </v-col>
              </v-row>
              
              <v-row>
                <v-col cols="12">
                  <v-switch
                    v-model="ingredient.optional"
                    label="Optional ingredient"
                    color="primary"
                    density="compact"
                    hide-details
                  ></v-switch>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
          
          <v-card-text v-if="ingredients.length > 0">
            <v-divider class="mb-3"></v-divider>
            <div class="d-flex justify-space-between">
              <strong>Ingredients Cost:</strong>
              <span>${{ calculateTotalIngredientsCost().toFixed(2) }}</span>
            </div>
          </v-card-text>
        </v-card>
        
        <!-- Additional Costs -->
        <v-card class="mb-4">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Additional Costs</span>
            <v-btn
              color="primary"
              size="small"
              prepend-icon="mdi-plus"
              @click="addAdditionalCost"
            >
              Add Cost
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <div v-if="additionalCosts.length === 0" class="text-center pa-4 text-grey">
              No additional costs added yet. Add costs like labor or packaging.
            </div>
            
            <div v-for="(cost, index) in additionalCosts" :key="index" class="cost-row mb-3">
              <v-row align="center">
                <v-col cols="12" md="5">
                  <v-text-field
                    v-model="cost.name"
                    label="Cost Name"
                    placeholder="e.g., Labor, Packaging"
                    :rules="[(v: string) => !!v || 'Name is required']"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="cost.amount"
                    label="Amount"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    :rules="[(v: number) => v >= 0 || 'Amount must be positive']"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="1" class="d-flex align-center justify-center">
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeAdditionalCost(index)"
                  ></v-btn>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
          
          <v-card-text v-if="additionalCosts.length > 0">
            <v-divider class="mb-3"></v-divider>
            <div class="d-flex justify-space-between">
              <strong>Additional Costs:</strong>
              <span>${{ calculateTotalAdditionalCosts().toFixed(2) }}</span>
            </div>
          </v-card-text>
        </v-card>
        
        <!-- Cost Summary and Pricing -->
        <v-card class="mb-4">
          <v-card-title>Cost Summary & Pricing</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-silverware-fork-knife" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>Total Ingredients Cost</v-list-item-title>
                    <v-list-item-subtitle class="text-right">${{ calculateTotalIngredientsCost().toFixed(2) }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-plus-circle-outline" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>Total Additional Costs</v-list-item-title>
                    <v-list-item-subtitle class="text-right">${{ calculateTotalAdditionalCosts().toFixed(2) }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-divider class="my-2"></v-divider>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-calculator" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title class="font-weight-bold">Total Product Cost</v-list-item-title>
                    <v-list-item-subtitle class="text-right font-weight-bold">${{ calculateTotalProductCost().toFixed(2) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="formState.price"
                  label="Selling Price"
                  prefix="$"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[(v: number) => v > 0 || 'Selling price must be greater than 0']"
                  required
                ></v-text-field>
                
                <div v-if="formState.price && calculateTotalProductCost() > 0">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span>Profit Margin:</span>
                    <span :class="profitMarginColor">${{ calculateProfitAmount().toFixed(2) }} ({{ calculateProfitMargin().toFixed(0) }}%)</span>
                  </div>
                  
                  <v-slider
                    v-model="targetMargin"
                    label="Target Profit Margin"
                    min="0"
                    max="100"
                    step="5"
                    thumb-label
                    @update:model-value="updatePriceFromMargin"
                  ></v-slider>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <!-- Inventory Settings -->
        <v-card class="mb-4">
          <v-card-title>Inventory Settings</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="formState.isInventoryTracked"
                  label="Track Inventory for this Product"
                  color="primary"
                ></v-switch>
              </v-col>
              
              <v-col cols="12" md="6" v-if="formState.isInventoryTracked">
                <v-text-field
                  v-model.number="formState.stock"
                  label="Initial Stock Level"
                  type="number"
                  min="0"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6" v-if="formState.isInventoryTracked">
                <v-text-field
                  v-model.number="formState.minStock"
                  label="Minimum Stock Level (Reorder Point)"
                  type="number"
                  min="0"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="formState.unit"
                  :items="unitOptions"
                  label="Selling Unit"
                  :rules="[(v: string) => !!v || 'Unit is required']"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formState.supplier"
                  label="Supplier"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="preparationTime"
                  label="Preparation Time (minutes)"
                  type="number"
                  min="0"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <div class="d-flex justify-end mt-4 mb-8">
          <v-btn
            variant="text"
            class="mr-2"
            @click="cancel"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            type="submit"
          >
            {{ isEdit ? 'Update Product' : 'Create Product' }}
          </v-btn>
        </div>
      </v-container>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useProductsStore, type Product } from '../../stores/products';
import { useInventoryStore, type IngredientItem, type Recipe } from '../../stores/inventory';

interface Props {
  product?: Product | null;
  recipe?: Recipe | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['save', 'cancel']);

const productsStore = useProductsStore();
const inventoryStore = useInventoryStore();

const isEdit = computed(() => !!props.product);

// Form state
const formState = reactive<Partial<Product>>({
  name: '',
  description: '',
  price: 0,
  cost: 0,
  category: '',
  stock: 0,
  minStock: 5,
  unit: 'Each',
  supplier: '',
  lastRestockDate: new Date().toISOString().split('T')[0],
  isInventoryTracked: true,
  currentStockLevel: 0
});

// Recipe components
const ingredients = ref<Array<IngredientItem & { name?: string, unit?: string, unitCost?: number }>>([]);
const additionalCosts = ref<Array<{ name: string, amount: number }>>([]);
const preparationTime = ref(0);

// Pricing helpers
const targetMargin = ref(40); // 40% default target margin

// Options for select inputs
const categoryOptions = [
  'Bakery', 
  'Beverages', 
  'Desserts', 
  'Entrees', 
  'Appetizers', 
  'Sides', 
  'Specials',
  'Other'
];

const unitOptions = [
  'Each',
  'Slice',
  'Serving',
  'Pound',
  'Ounce',
  'Cup',
  'Box',
  'Package'
];

// Available ingredients - all products that can be used as ingredients
const availableIngredients = computed(() => {
  return productsStore.products.map(product => ({
    id: product.id,
    name: product.name,
    unit: product.unit,
    cost: product.cost
  }));
});

// Load product and recipe data if editing
onMounted(() => {
  if (props.product) {
    // Load product data
    Object.assign(formState, props.product);
    
    // Load recipe data if exists
    if (props.recipe) {
      preparationTime.value = props.recipe.preparationTime;
      
      // Load ingredients
      props.recipe.ingredients.forEach(ingredient => {
        const productDetails = productsStore.getProductById(
          typeof ingredient.productId === 'string' 
            ? parseInt(ingredient.productId.toString()) 
            : ingredient.productId
        );
        
        ingredients.value.push({
          ...ingredient,
          name: productDetails?.name,
          unit: productDetails?.unit,
          unitCost: productDetails?.cost
        });
      });
    }
    
    // Calculate additional costs (total cost - ingredients cost)
    const ingredientsCost = calculateTotalIngredientsCost();
    if (props.product.cost > ingredientsCost) {
      additionalCosts.value.push({
        name: 'Other Costs',
        amount: props.product.cost - ingredientsCost
      });
    }
  }
});

// Ingredient management
const addIngredient = () => {
  ingredients.value.push({
    productId: '',
    quantity: 1,
    optional: false,
    name: '',
    unit: '',
    unitCost: 0
  });
};

const removeIngredient = (index: number) => {
  ingredients.value.splice(index, 1);
};

const updateIngredientDetails = (index: number) => {
  const ingredient = ingredients.value[index];
  const product = productsStore.getProductById(
    typeof ingredient.productId === 'string' 
      ? parseInt(ingredient.productId.toString()) 
      : ingredient.productId
  );
  
  if (product) {
    ingredient.name = product.name;
    ingredient.unit = product.unit;
    ingredient.unitCost = product.cost;
  }
};

// Additional costs management
const addAdditionalCost = () => {
  additionalCosts.value.push({
    name: '',
    amount: 0
  });
};

const removeAdditionalCost = (index: number) => {
  additionalCosts.value.splice(index, 1);
};

// Cost calculations
const calculateIngredientCost = (ingredient: { quantity: number, unitCost?: number }) => {
  return (ingredient.quantity || 0) * (ingredient.unitCost || 0);
};

const calculateTotalIngredientsCost = () => {
  return ingredients.value.reduce((total, ingredient) => {
    return total + calculateIngredientCost(ingredient);
  }, 0);
};

const calculateTotalAdditionalCosts = () => {
  return additionalCosts.value.reduce((total, cost) => {
    return total + (cost.amount || 0);
  }, 0);
};

const calculateTotalProductCost = () => {
  return calculateTotalIngredientsCost() + calculateTotalAdditionalCosts();
};

// Profit calculations
const calculateProfitAmount = () => {
  return (formState.price || 0) - calculateTotalProductCost();
};

const calculateProfitMargin = () => {
  if (!formState.price || formState.price <= 0) return 0;
  return (calculateProfitAmount() / (formState.price || 0)) * 100;
};

const profitMarginColor = computed(() => {
  const margin = calculateProfitMargin();
  if (margin < 20) return 'text-error';
  if (margin < 40) return 'text-warning';
  return 'text-success';
});

// Update price based on target margin
const updatePriceFromMargin = () => {
  const cost = calculateTotalProductCost();
  if (cost <= 0) return;
  
  // Price = Cost / (1 - margin as decimal)
  formState.price = +(cost / (1 - targetMargin.value / 100)).toFixed(2);
};

// Form submission
const submitForm = async () => {
  // Update the cost based on ingredients and additional costs
  formState.cost = calculateTotalProductCost();
  
  try {
    let productId: number;
    
    // Save or update the product
    if (isEdit.value && props.product) {
      const updatedProduct = await productsStore.updateProduct(props.product.id, formState);
      productId = updatedProduct.id;
    } else {
      const newProduct = await productsStore.addProduct(formState as Omit<Product, 'id'>);
      productId = newProduct.id;
    }
    
    // Create or update the recipe
    const recipeData: Omit<Recipe, 'id'> = {
      productId,
      name: formState.name || '',
      ingredients: ingredients.value.map(ingredient => ({
        productId: ingredient.productId,
        quantity: ingredient.quantity,
        optional: ingredient.optional
      })),
      preparationTime: preparationTime.value,
      notes: formState.description
    };
    
    if (props.recipe) {
      await inventoryStore.updateRecipe(props.recipe.id, recipeData);
    } else {
      await inventoryStore.addRecipe(recipeData);
    }
    
    emit('save');
  } catch (error) {
    console.error('Error saving product:', error);
    // Handle error
  }
};

const cancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.ingredient-row, .cost-row {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
}

.text-right {
  text-align: right;
}

.text-success {
  color: green;
}

.text-warning {
  color: orange;
}

.text-error {
  color: red;
}
</style> 
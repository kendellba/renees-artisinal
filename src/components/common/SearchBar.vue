<template>
  <v-text-field
    v-model="searchValue"
    :label="label"
    :placeholder="placeholder"
    prepend-inner-icon="mdi-magnify"
    single-line
    hide-details
    density="compact"
    class="search-field"
    @update:model-value="onSearch"
  ></v-text-field>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  debounce?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: 'Search',
  placeholder: 'Type to search...',
  debounce: 300
});

const emit = defineEmits(['update:modelValue', 'search']);

const searchValue = ref(props.modelValue);
let debounceTimer: number | null = null;

watch(() => props.modelValue, (newValue) => {
  searchValue.value = newValue;
});

const onSearch = (value: string) => {
  emit('update:modelValue', value);
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = window.setTimeout(() => {
    emit('search', value);
  }, props.debounce);
};
</script>

<style scoped>
.search-field {
  max-width: 300px;
}
</style> 
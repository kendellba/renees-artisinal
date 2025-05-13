<template>
  <v-chip
    :color="color"
    :size="size"
    :variant="variant"
    :class="customClass"
  >
    <v-icon
      v-if="icon"
      :icon="icon"
      :size="iconSize"
      class="mr-1"
    ></v-icon>
    <slot>{{ label }}</slot>
  </v-chip>
</template>

<script setup lang="ts">
interface Props {
  color?: string;
  size?: 'small' | 'default' | 'large';
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain';
  icon?: string;
  iconSize?: string | number;
  label?: string;
  customClass?: string;
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  size: 'default',
  variant: 'flat',
  icon: undefined,
  iconSize: 'small',
  label: '',
  customClass: ''
});
</script> 
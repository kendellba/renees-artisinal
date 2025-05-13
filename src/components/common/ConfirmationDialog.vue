<template>
  <v-dialog
    v-model="modelValue"
    :max-width="maxWidth"
    :persistent="persistent"
  >
    <v-card>
      <v-card-title class="text-h5">
        <v-icon
          v-if="icon"
          :icon="icon"
          :color="iconColor"
          size="large"
          class="mr-2"
        ></v-icon>
        {{ title }}
      </v-card-title>

      <v-card-text class="d-flex align-center">
        <slot>
          {{ message }}
        </slot>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :color="cancelColor"
          variant="text"
          @click="onCancel"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="text"
          @click="onConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title?: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  cancelColor?: string;
  maxWidth?: string | number;
  persistent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  icon: 'mdi-alert',
  iconColor: 'warning',
  confirmText: 'Yes',
  cancelText: 'No',
  confirmColor: 'primary',
  cancelColor: 'grey-darken-1',
  maxWidth: 450,
  persistent: false
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const onConfirm = () => {
  emit('confirm');
  emit('update:modelValue', false);
};

const onCancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
};
</script> 
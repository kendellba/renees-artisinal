<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-bell-outline" class="mr-2"></v-icon>
      Notification Settings
    </v-card-title>
    
    <v-card-text>
      <div v-if="!isSupported" class="text-center pa-4">
        <v-icon icon="mdi-bell-off-outline" color="error" size="large"></v-icon>
        <p class="mt-2">Notifications are not supported in your browser.</p>
      </div>
      
      <div v-else>
        <v-switch
          v-model="notificationsEnabled"
          label="Enable notifications"
          @update:model-value="toggleNotifications"
          :disabled="permissionDenied"
          hide-details
        ></v-switch>
        
        <p v-if="permissionDenied" class="text-caption mt-1 text-error">
          Notifications are blocked. Please update your browser settings.
        </p>
        
        <v-divider v-if="notificationsEnabled" class="my-4"></v-divider>
        
        <div v-if="notificationsEnabled">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Notification Topics</h3>
          
          <v-row>
            <v-col cols="12" class="py-0">
              <v-checkbox
                v-model="topicSubscriptions.lowStock"
                label="Low Stock Alerts"
                hide-details
                @update:model-value="(val) => toggleTopic('low-stock', val)"
              ></v-checkbox>
            </v-col>
            
            <v-col cols="12" class="py-0">
              <v-checkbox
                v-model="topicSubscriptions.newOrders"
                label="New Order Notifications"
                hide-details
                @update:model-value="(val) => toggleTopic('new-orders', val)"
              ></v-checkbox>
            </v-col>
            
            <v-col cols="12" class="py-0">
              <v-checkbox
                v-model="topicSubscriptions.dailyReports"
                label="Daily Reports"
                hide-details
                @update:model-value="(val) => toggleTopic('daily-reports', val)"
              ></v-checkbox>
            </v-col>
          </v-row>
          
          <div class="d-flex justify-end mt-4">
            <v-btn 
              color="primary" 
              variant="text" 
              size="small"
              @click="testNotification"
              :loading="testingNotification"
            >
              Test Notification
            </v-btn>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { notificationService } from '../services/notifications';

// State for notification controls
const isSupported = ref(false);
const notificationsEnabled = ref(false);
const permissionDenied = ref(false);
const testingNotification = ref(false);

// Manage topic subscriptions
const topicSubscriptions = ref({
  lowStock: false,
  newOrders: false,
  dailyReports: false
});

// Check if notification permission has been granted
const checkPermissionStatus = () => {
  if (!notificationService.isSupported()) {
    isSupported.value = false;
    return;
  }
  
  isSupported.value = true;
  
  // Check current permission state
  const permission = Notification.permission;
  
  if (permission === 'granted') {
    notificationsEnabled.value = true;
    permissionDenied.value = false;
  } else if (permission === 'denied') {
    notificationsEnabled.value = false;
    permissionDenied.value = true;
  } else {
    notificationsEnabled.value = false;
    permissionDenied.value = false;
  }
};

// Toggle notifications on/off
const toggleNotifications = async (value: boolean) => {
  if (value) {
    const token = await notificationService.requestPermission();
    
    if (!token) {
      notificationsEnabled.value = false;
      
      // Check if permission is denied
      if (Notification.permission === 'denied') {
        permissionDenied.value = true;
      }
    } else {
      // Load saved topic subscriptions
      loadTopicSubscriptions();
    }
  }
};

// Toggle subscription to a topic
const toggleTopic = async (topic: string, subscribed: boolean) => {
  if (subscribed) {
    await notificationService.subscribeToTopic(topic);
  } else {
    await notificationService.unsubscribeFromTopic(topic);
  }
};

// Test notification
const testNotification = async () => {
  testingNotification.value = true;
  
  try {
    await notificationService.showTestNotification();
  } catch (error) {
    console.error('Error showing test notification:', error);
  } finally {
    testingNotification.value = false;
  }
};

// Load currently subscribed topics
const loadTopicSubscriptions = () => {
  const topics = notificationService.getSubscribedTopics();
  
  topicSubscriptions.value = {
    lowStock: topics.includes('low-stock'),
    newOrders: topics.includes('new-orders'),
    dailyReports: topics.includes('daily-reports')
  };
};

// Initialize component
onMounted(() => {
  checkPermissionStatus();
  
  if (notificationsEnabled.value) {
    loadTopicSubscriptions();
  }
});
</script>

<style scoped>
.v-divider {
  border-color: rgba(0, 0, 0, 0.1);
}
</style> 
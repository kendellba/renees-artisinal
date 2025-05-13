import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './database';

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

// Your Firebase vapid key
const vapidKey = 'BIVIJjz5TDy0tDJSQjLSrAL3XdRUQb71Qhyo5lVs6xmPugvWh93nWyZ84vnYl1afW9gnJMwCMiPsxRQVwVRLnJM';

// Store for notification subscriptions
class NotificationService {
  private permissionGranted = false;
  private token: string | null = null;
  
  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
  
  // Request permission and get token
  async requestPermission(): Promise<string | null> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported in this browser');
      return null;
    }
    
    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      
      if (!this.permissionGranted) {
        console.warn('Notification permission denied');
        return null;
      }
      
      // Get registration token
      this.token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', this.token);
      
      // Save token to localStorage
      if (this.token) {
        localStorage.setItem('fcm_token', this.token);
      }
      
      return this.token;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }
  
  // Listen for foreground messages
  onForegroundMessage(callback: (payload: any) => void): () => void {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
    });
    
    return unsubscribe;
  }
  
  // Check if permission is granted
  isPermissionGranted(): boolean {
    return this.permissionGranted || Notification.permission === 'granted';
  }
  
  // Get current token
  getToken(): string | null {
    return this.token || localStorage.getItem('fcm_token');
  }
  
  // Subscribe to topic (requires server implementation)
  async subscribeToTopic(topic: string): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      console.warn('No FCM token available for subscription');
      return false;
    }
    
    try {
      // This typically requires a server implementation to call Firebase API
      // Here we'll just simulate success and store the subscription locally
      const topics = JSON.parse(localStorage.getItem('fcm_topics') || '[]');
      if (!topics.includes(topic)) {
        topics.push(topic);
        localStorage.setItem('fcm_topics', JSON.stringify(topics));
      }
      return true;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }
  
  // Unsubscribe from topic (requires server implementation)
  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      console.warn('No FCM token available for unsubscription');
      return false;
    }
    
    try {
      // This typically requires a server implementation to call Firebase API
      // Here we'll just simulate success and remove from local storage
      const topics = JSON.parse(localStorage.getItem('fcm_topics') || '[]');
      const updatedTopics = topics.filter((t: string) => t !== topic);
      localStorage.setItem('fcm_topics', JSON.stringify(updatedTopics));
      return true;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }
  
  // Get subscribed topics
  getSubscribedTopics(): string[] {
    return JSON.parse(localStorage.getItem('fcm_topics') || '[]');
  }
  
  // Display a test notification
  async showTestNotification(): Promise<boolean> {
    if (!this.isPermissionGranted()) {
      await this.requestPermission();
      if (!this.isPermissionGranted()) {
        return false;
      }
    }
    
    const notification = new Notification('Renee\'s Artisinal Café', {
      body: 'This is a test notification',
      icon: '/favicon.ico',
    });
    
    notification.onclick = () => {
      console.log('Notification clicked');
      window.focus();
      notification.close();
    };
    
    return true;
  }
}

export const notificationService = new NotificationService();

// Function to check for low stock and send notifications
export const checkLowStockAndNotify = async (products: any[]): Promise<void> => {
  if (!notificationService.isPermissionGranted()) {
    return;
  }
  
  const lowStockProducts = products.filter(product => 
    product.stock <= product.minStock
  );
  
  if (lowStockProducts.length > 0) {
    const notification = new Notification('Low Stock Alert', {
      body: `${lowStockProducts.length} products need to be restocked`,
      icon: '/favicon.ico',
    });
    
    notification.onclick = () => {
      window.location.href = '/inventory';
      notification.close();
    };
  }
};

// Function to notify for new orders
export const notifyNewOrder = (order: any): void => {
  if (!notificationService.isPermissionGranted()) {
    return;
  }
  
  const notification = new Notification('New Order', {
    body: `New order #${order.id} for $${order.totalAmount.toFixed(2)}`,
    icon: '/favicon.ico',
  });
  
  notification.onclick = () => {
    window.location.href = `/sales?orderId=${order.id}`;
    notification.close();
  };
}; 
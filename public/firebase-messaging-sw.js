// Firebase Service Worker for background notifications

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDo0Ku4YoR1JyXUaR7FDF8yC5Wk5WTty7o",
  authDomain: "renees-artisinal.firebaseapp.com",
  projectId: "renees-artisinal",
  storageBucket: "renees-artisinal.firebasestorage.app",
  messagingSenderId: "790164459902",
  appId: "1:790164459902:web:e82c40a4be31819a52a32f",
  measurementId: "G-V551YVPGNF"
};

// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click ', event);
  
  event.notification.close();
  
  // This will open the app and focus the window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there is already a window/tab open with the target URL
        if (clientList.length > 0) {
          // If so, focus it
          return clientList[0].focus();
        }
        // If not, open a new window
        return clients.openWindow('/');
      })
  );
}); 
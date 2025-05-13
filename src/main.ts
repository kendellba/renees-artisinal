import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index'

import { notificationService } from './services/notifications'

// Import PrimeVue CSS
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

// Import Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

// Import Chart.js (global setup)
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})

// Create app
const app = createApp(App)

// Register plugins
app.use(createPinia())
app.use(router)
app.use(vuetify)

// Mount app
app.mount('#app')

// Register service worker for FCM
if (false && 'serviceWorker' in navigator) { // Disable for now
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}

// Initialize notification service when app is ready
if (false && notificationService.isSupported()) { // Disable for now
  // If permission already granted, get token
  if (notificationService.isPermissionGranted()) {
    notificationService.requestPermission().catch(console.error);
  }

  // Auto-request permission when user interacts with the page
  document.addEventListener('click', () => {
    if (!notificationService.isPermissionGranted()) {
      notificationService.requestPermission().catch(console.error);
    }
  }, { once: true });
}

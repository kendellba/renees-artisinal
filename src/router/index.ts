import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import { auth } from '../services/database';

// Auth guard function
const requireAuth = (to: any, from: any, next: any) => {
  const user = localStorage.getItem('user');
  
  // If there's a user in localStorage, they're either logged in or in offline mode
  if (user) {
    next();
    return;
  }

  // Otherwise, check Firebase auth
  if (auth.currentUser) {
    next();
  } else {
    // Redirect to login
    next('/login');
  }
};

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/products',
    name: 'products',
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('../views/ProductsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/product-builder',
    name: 'product-builder',
    component: () => import('../views/ProductBuilderView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/sales',
    name: 'sales',
    component: () => import('../views/SalesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/purchases',
    name: 'purchases',
    component: () => import('../views/PurchasesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('../views/InventoryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/invoices',
    name: 'invoices',
    component: () => import('../views/InvoicesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('../views/ReportsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Apply auth guard to routes that require authentication
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    requireAuth(to, from, next);
  } else {
    next();
  }
});

export default router 
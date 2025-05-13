<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>{{ isRegister ? 'Register' : 'Login' }}</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="submitForm" ref="form">
              <v-text-field
                v-model="email"
                label="Email"
                name="email"
                prepend-inner-icon="mdi-email"
                type="email"
                required
                :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                prepend-inner-icon="mdi-lock"
                type="password"
                required
                :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Password must be at least 6 characters']"
              ></v-text-field>

              <v-text-field
                v-if="isRegister"
                v-model="confirmPassword"
                label="Confirm Password"
                name="confirmPassword"
                prepend-inner-icon="mdi-lock-check"
                type="password"
                required
                :rules="[
                  v => !!v || 'Password confirmation is required',
                  v => v === password || 'Passwords must match'
                ]"
              ></v-text-field>
            </v-form>

            <div v-if="error" class="error-message text-error mt-4">
              {{ error }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              @click="submitForm"
              :loading="loading"
            >
              {{ isRegister ? 'Register' : 'Login' }}
            </v-btn>
          </v-card-actions>
          <v-card-text class="text-center">
            <a href="#" @click.prevent="isRegister = !isRegister">
              {{ isRegister ? 'Already have an account? Login' : 'Don\'t have an account? Register' }}
            </a>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showOfflineDialog" max-width="400">
      <v-card>
        <v-card-title>Offline Mode</v-card-title>
        <v-card-text>
          <p>You appear to be offline. Would you like to continue in offline mode?</p>
          <p class="text-caption">Note: Your changes will be synchronized when you're back online.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="continueOffline">
            Continue Offline
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { loginUser, registerUser } from '../services/database';

const router = useRouter();
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isRegister = ref(false);
const loading = ref(false);
const error = ref('');
const showOfflineDialog = ref(false);
const form = ref<any>(null);

// Check network status
const isOnline = ref(navigator.onLine);

// Watch for network status changes
watch(() => navigator.onLine, (online) => {
  isOnline.value = online;
});

const submitForm = async () => {
  // Form validation
  if (!form.value) return;
  const { valid } = await form.value.validate();
  
  if (!valid) {
    error.value = 'Please fix the errors in the form.';
    return;
  }

  // Check if we're online
  if (!isOnline.value) {
    showOfflineDialog.value = true;
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    if (isRegister.value) {
      // Registration
      await registerUser(email.value, password.value);
      router.push('/');
    } else {
      // Login
      await loginUser(email.value, password.value);
      router.push('/');
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred.';
  } finally {
    loading.value = false;
  }
};

const continueOffline = async () => {
  // Store user in localStorage to "fake" login for offline mode
  localStorage.setItem('user', JSON.stringify({
    email: email.value,
    isOfflineUser: true
  }));
  
  router.push('/');
  showOfflineDialog.value = false;
};
</script>

<style scoped>
.fill-height {
  height: 100%;
}

.error-message {
  color: #f44336;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
}
</style> 
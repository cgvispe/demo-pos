<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo / Brand -->
      <div class="brand">
        <div class="brand-icon">
          <img v-if="theme.logoUrl" :src="theme.logoUrl" alt="Logo" />
          <span v-else class="brand-emoji">🏪</span>
        </div>
        <h1 class="brand-name">{{ theme.businessName }}</h1>
        <p class="brand-sub">Point of Sale System</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter username"
            autocomplete="username"
            autofocus
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-msg">
          <span>⚠️</span> {{ error }}
        </div>

        <button type="submit" class="btn-login" :disabled="loading || !username || !password">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <p class="demo-hint">Demo: <strong>admin</strong> / <strong>password</strong> · <strong>cashier</strong> / <strong>password</strong></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const user = await auth.login(username.value, password.value)
    router.push(user.role === 'manager' ? '/manager' : '/retail')
  } catch (e) {
    error.value = e.response?.data?.error || 'Login failed. Check credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* Sesami ambient glow */
.login-page::before {
  content: '';
  position: absolute;
  bottom: -80px;
  right: -80px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(0,196,179,0.1) 0%, transparent 65%);
  pointer-events: none;
}
.login-page::after {
  content: '';
  position: absolute;
  top: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(0,196,179,0.05) 0%, transparent 65%);
  pointer-events: none;
}

.login-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}

.brand {
  text-align: center;
  margin-bottom: 40px;
}

.brand-icon {
  width: 80px;
  height: 80px;
  background: var(--color-primary-alpha);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  overflow: hidden;
}

.brand-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-emoji { font-size: 40px; line-height: 1; }

.brand-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

.brand-sub {
  font-size: 14px;
  color: var(--color-text-2);
  margin-top: 4px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-2);
}

.field input {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-family);
  font-size: 16px;
  padding: 14px 16px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.field input:disabled { opacity: 0.6; cursor: not-allowed; }

.error-msg {
  background: var(--color-danger-alpha);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-login {
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 600;
  padding: 16px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
}

.btn-login:hover:not(:disabled) { opacity: 0.9; }
.btn-login:active:not(:disabled) { transform: scale(0.98); }
.btn-login:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.demo-hint {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 24px;
}

.demo-hint strong { color: var(--color-text-2); }
</style>

<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
onMounted(() => theme.apply())
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

:root {
  /* Sesami defaults — overridden dynamically by theme store */
  --color-bg:        #090b0f;
  --color-surface:   #0f1117;
  --color-surface-2: #15181f;
  --color-surface-3: #1c2028;
  --color-border:    #1e2330;
  --color-text:      #e8edf2;
  --color-text-2:    #8896a8;
  --color-text-3:    #4d5a6b;
  --color-primary:       #00c4b3;
  --color-primary-alpha: #00c4b322;
  --color-success:       #00c4b3;
  --color-success-alpha: #00c4b322;
  --color-danger:        #f05252;
  --color-danger-alpha:  #f0525222;
  --color-warning:       #f0a500;
  --color-warning-alpha: #f0a50022;
  --color-info:          #3b9eff;
  --font-family:   'Inter', sans-serif;
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.5);
  --shadow-md: 0 4px 20px rgba(0,0,0,0.65);
  --shadow-lg: 0 8px 40px rgba(0,0,0,0.8);
}

html, body {
  height: 100%;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-family);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Sesami subtle teal glow in the bottom-right corner — matches screenshot */
body[data-theme="dark"]::after {
  content: '';
  position: fixed;
  bottom: -120px;
  right: -120px;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(0,196,179,0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

/* Scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-text-3); }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { transition: all 0.25s ease-out; }
.slide-up-leave-active { transition: all 0.2s ease-in; }
.slide-up-enter-from { opacity: 0; transform: translateY(20px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
</style>

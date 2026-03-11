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
  --color-bg:        #19191F;
  --color-surface:   #25252D;
  --color-surface-2: #36363E;
  --color-surface-3: #3F3F46;
  --color-border:    #3F3F46;
  --color-text:      #F6F6F7;
  --color-text-2:    #929296;
  --color-text-3:    #66666C;
  --color-primary:       #5CE5DB;
  --color-primary-alpha: #5CE5DB33;
  --color-aqua:    #5CE5DB;
  --color-purple:  #A6A6FF;
  --color-yellow:  #E7F218;
  --color-success:       #5CE5DB;
  --color-success-alpha: #5CE5DB22;
  --color-danger:        #f05252;
  --color-danger-alpha:  #f0525222;
  --color-warning:       #E7F218;
  --color-warning-alpha: #E7F21822;
  --color-info:          #A6A6FF;
  --font-family:     'Neue Haas Unica', 'Inter', Arial, sans-serif;
  --font-size-base:  15px;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
  --radius-xl:  20px;
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.6);
  --shadow-md: 0 4px 20px rgba(0,0,0,0.75);
  --shadow-lg: 0 8px 40px rgba(0,0,0,0.85);
}

html {
  font-size: var(--font-size-base, 15px);
  /* Minimum width — supports 800x480 kiosk screens */
  min-width: 800px;
}

body {
  height: 100%;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-family);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Sesami teal glow — dark mode only */
body[data-theme="dark"]::after {
  content: '';
  position: fixed;
  bottom: -120px;
  right: -120px;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(92,229,219,0.07) 0%, transparent 70%);
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

/* ── Scrollbars ── */
::-webkit-scrollbar       { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-text-3); }

/* ── Transitions ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active { transition: all 0.25s ease-out; }
.slide-up-leave-active { transition: all 0.2s ease-in; }
.slide-up-enter-from { opacity: 0; transform: translateY(20px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* ── Modal backdrop (global) ── */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  padding: 12px;
}
.modal-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  width: 100%;
}

/* ── Responsive helpers ── */
/* 800px minimum — scale comfortably on kiosk screens */
@media (max-width: 900px) {
  :root { --radius-sm: 5px; --radius-md: 8px; }
}

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
</style>

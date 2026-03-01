<template>
  <button class="product-card" @click="$emit('add', product)" :aria-label="`Add ${product.name}`">
    <div class="card-image">
      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
      <span v-else class="card-emoji">{{ product.emoji || '🛍️' }}</span>
    </div>
    <div class="card-body">
      <span class="card-code">{{ product.code }}</span>
      <p class="card-name">{{ product.name }}</p>
      <p class="card-price">{{ theme.formatCurrency(product.price) }}</p>
    </div>
    <div class="card-add-indicator">
      <span>+</span>
    </div>
  </button>
</template>

<script setup>
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
defineProps({ product: Object })
defineEmits(['add'])
</script>

<style scoped>
.product-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  text-align: left;
  transition: border-color 0.15s, transform 0.1s, box-shadow 0.15s;
  width: 100%;
  position: relative;
}

.product-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-md);
}

.product-card:active {
  transform: scale(0.97);
}

.card-image {
  aspect-ratio: 1 / 1;
  background: var(--color-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-emoji {
  font-size: 52px;
  line-height: 1;
  user-select: none;
}

.card-body {
  padding: 12px 14px 14px;
  flex: 1;
}

.card-code {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-top: 4px;
  line-height: 1.3;
}

.card-price {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: 6px;
}

.card-add-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 700;
  opacity: 0;
  transform: scale(0.7);
  transition: opacity 0.15s, transform 0.15s;
}

.product-card:hover .card-add-indicator {
  opacity: 1;
  transform: scale(1);
}
</style>

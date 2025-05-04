<template>
  <button class="back-btn" @click="goBack" aria-label="Повернутися назад">
    ←
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goBack() {
  router.back()
}
</script>

<style scoped>
.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  /* Adjust background for better visibility on different themes */
  background: color-mix(in srgb, var(--color-secondary-bg, var(--color-background-soft)) 70%, transparent);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 36px;
  height: 36px;
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text); /* Use main text color */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s;
  box-shadow: none;
  padding: 0;
}
.back-btn:hover {
  background: color-mix(in srgb, var(--color-secondary-bg, var(--color-background-soft)) 90%, transparent);
}
</style> 
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
  background: rgba(240,240,240,0.7);
  border: none;
  border-radius: 12px;
  width: 36px;
  height: 36px;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s;
  box-shadow: none;
  padding: 0;
}
.back-btn:hover {
  background: rgba(240,240,240,0.9);
}
</style> 
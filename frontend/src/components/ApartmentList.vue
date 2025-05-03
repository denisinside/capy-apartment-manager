<template>
  <div class="apartment-list">
    <ApartmentCard v-for="apt in apartments" :key="apt._id" :apartment="apt.apartment" :is-favourite="apt.is_favourite" />
    <div v-if="loading" class="loading">Завантаження...</div>
    <div v-if="!loading && apartments.length === 0" class="no-results">{{ emptyText }}</div>
  </div>
</template>

<script setup>
import ApartmentCard from '../views/ApartmentCard.vue'
const props = defineProps({
  apartments: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Нічого не знайдено' }
})
</script>

<style scoped>
.apartment-list {
  padding: 12px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.loading {
  text-align: center;
  color: #b48c6e;
  font-size: 1.1rem;
  margin: 18px 0;
}
.no-results {
  text-align: center;
  color: #b00;
  font-size: 1.1rem;
  margin: 18px 0;
}
</style> 
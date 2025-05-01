<template>
  <div class="list-view">
    <h2>Нові квартири</h2>
    <div v-if="loading">Завантаження...</div>
    <div v-else-if="error">Сталася помилка: {{ error }}</div>
    <div v-else>
      <ApartmentCard
        v-for="apt in apartments"
        :key="apt._id"
        :apartment="apt.apartment"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchApartments } from '../api.js'
import ApartmentCard from './ApartmentCard.vue'

const apartments = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const response = await fetchApartments({ city: 'Київ' })
    if (response.success && Array.isArray(response.data)) {
      apartments.value = response.data
    } else {
      throw new Error('Некоректний формат даних від сервера')
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.list-view {
  padding: 16px 0 72px 0;
}
</style> 
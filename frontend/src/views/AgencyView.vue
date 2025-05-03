<template>
  <div class="agency-view">
    <BackButton />
    <div class="agency-block-fixed">
      <div class="agency-info-centered">
        <div class="agency-name">{{ agencyName }}</div>
      </div>
      <div class="apartment-count">Знайдено {{ apartments.length }} квартир</div>
    </div>
    <ApartmentList :apartments="apartments" :loading="loading" empty-text="Нічого не знайдено" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchApartmentsByAgency } from '../api.js'
import ApartmentList from '../components/ApartmentList.vue'
import BackButton from '../components/BackButton.vue'

const route = useRoute()
const agencyName = route.params.name
const apartments = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetchApartmentsByAgency(agencyName)
    if (res.success && Array.isArray(res.data)) {
      apartments.value = res.data
    } else {
      apartments.value = []
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.agency-view {
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 80px;
  position: relative;
}
.agency-block-fixed {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  margin: 0 0 18px 0;
  padding: 18px 18px 10px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  text-align: center; /* Center align text within the block */
}
.agency-info-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}
.agency-name {
  font-weight: 700; /* Bolder agency name */
  font-size: 20px; /* Larger agency name */
  color: #222;
  line-height: 1.2;
}
.apartment-count {
  font-size: 1.1rem;
  color: #b48c6e;
  font-weight: 500;
  margin-bottom: 0;
  text-align: center;
}
</style> 
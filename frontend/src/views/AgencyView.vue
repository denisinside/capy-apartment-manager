<template>
  <div class="agency-view">
    <BackButton />
    <div class="agency-block-fixed">
      <div class="agency-info-centered">
        <div class="agency-name">{{ agencyName }}</div>
      </div>
      <button 
        class="toggle-rieltors-btn" 
        @click="toggleRieltorList"
        :disabled="rieltorLoading && !rieltorsVisible" 
      >
        {{ rieltorsVisible ? 'Сховати рієлторів' : 'Показати рієлторів' }} 
        <span v-if="rieltorLoading && !rieltorsVisible">...</span>
        <span v-else class="arrow">{{ rieltorsVisible ? '▲' : '▼' }}</span>
      </button>
      <div v-if="rieltorsVisible" class="rieltor-list-container">
        <div v-if="rieltorLoading" class="loading-small">Завантаження рієлторів...</div>
        <div v-else-if="rieltors.length === 0" class="no-rieltors">Рієлторів не знайдено.</div>
        <ul v-else class="rieltor-list">
          <li v-for="rieltor in rieltors" :key="rieltor.name + (rieltor.phone_number || '')" @click="goToRieltor(rieltor.name)" class="rieltor-item">
            <span class="rieltor-list-name">{{ rieltor.name }}</span>
            <span class="rieltor-list-position">{{ rieltor.position }}</span>
          </li>
        </ul>
      </div>
      <div class="apartment-count">Знайдено {{ apartments.length }} квартир</div>
    </div>
    <ApartmentList :apartments="apartments" :loading="loading" empty-text="Нічого не знайдено" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchApartmentsByAgency, fetchRieltorsByAgencyName } from '../api.js'
import ApartmentList from '../components/ApartmentList.vue'
import BackButton from '../components/BackButton.vue'

const route = useRoute()
const router = useRouter()
const agencyName = route.params.name
const apartments = ref([])
const loading = ref(false)

const rieltors = ref([])
const rieltorsVisible = ref(false)
const rieltorLoading = ref(false)
const rieltorsLoaded = ref(false)

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

async function loadRieltors() {
  if (rieltorsLoaded.value) return;

  rieltorLoading.value = true;
  try {
    const res = await fetchRieltorsByAgencyName(agencyName);
    if (res.success && Array.isArray(res.data)) {
      rieltors.value = res.data;
    } else {
      rieltors.value = [];
    }
    rieltorsLoaded.value = true;
  } catch (error) {
    console.error("Failed to load realtors:", error);
    rieltors.value = [];
  } finally {
    rieltorLoading.value = false;
  }
}

function toggleRieltorList() {
  rieltorsVisible.value = !rieltorsVisible.value;
  if (rieltorsVisible.value && !rieltorsLoaded.value) {
    loadRieltors();
  }
}

function goToRieltor(rieltorName) {
  router.push({ name: 'rieltor', params: { name: rieltorName } });
}

</script>

<style scoped>
.agency-view {
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 80px;
  position: relative;
}
.agency-block-fixed {
  background: var(--color-section-bg);
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  margin: 0 0 18px 0;
  padding: 18px 18px 10px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  text-align: center;
  padding-bottom: 18px;
}
.agency-info-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}
.agency-name {
  font-weight: 700;
  font-size: 20px;
  color: var(--color-text);
  line-height: 1.2;
}
.toggle-rieltors-btn {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 10px;
  transition: background-color 0.2s;
}
.toggle-rieltors-btn:hover {
  background-color: var(--color-background-mute);
}
.toggle-rieltors-btn .arrow {
  font-size: 0.8em;
  margin-left: 5px;
}
.toggle-rieltors-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}
.rieltor-list-container {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}
.loading-small, .no-rieltors {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.95em;
  padding: 10px 0;
}
.rieltor-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}
.rieltor-item {
  padding: 8px 5px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.15s;
}
.rieltor-item:hover {
  background-color: var(--color-background-mute);
}
.rieltor-item:last-child {
  border-bottom: none;
}
.rieltor-list-name {
  font-weight: 500;
  color: var(--color-text);
}
.rieltor-list-position {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}
.apartment-count {
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: 400;
  margin-top: 15px;
  text-align: center;
}
</style> 
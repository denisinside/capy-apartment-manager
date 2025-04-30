<template>
  <div class="search-view">
    <h2>Smart Apartment Collector</h2>
    <form class="search-form" @submit.prevent="onSearch">
      <div class="form-row">
        <label>Кімнат</label>
        <select v-model="filters.rooms">
          <option value="">Будь-яка</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <div class="form-row">
        <label>Ціна (від/до)</label>
        <input v-model.number="filters.priceMin" type="number" placeholder="від" min="0" />
        <input v-model.number="filters.priceMax" type="number" placeholder="до" min="0" />
      </div>
      <div class="form-row">
        <label>Поверх (від/до)</label>
        <input v-model.number="filters.floorMin" type="number" placeholder="від" min="0" />
        <input v-model.number="filters.floorMax" type="number" placeholder="до" min="0" />
      </div>
      <div class="form-row">
        <label>Площа (від/до)</label>
        <input v-model.number="filters.areaMin" type="number" placeholder="від" min="0" />
        <input v-model.number="filters.areaMax" type="number" placeholder="до" min="0" />
      </div>
      <div class="form-row">
        <label>Район</label>
        <input v-model="filters.district" placeholder="Район" />
      </div>
      <div class="form-row">
        <label><input type="checkbox" v-model="filters.allowPets" /> Можна з тваринами</label>
        <label><input type="checkbox" v-model="filters.allowChildren" /> Можна з дітьми</label>
        <label><input type="checkbox" v-model="filters.noCommission" /> Без комісії</label>
      </div>
      <button class="search-btn" type="submit">Знайти</button>
    </form>
    <div v-if="loading">Завантаження...</div>
    <div v-else-if="error">Сталася помилка: {{ error }}</div>
    <div v-else-if="results.length">
      <h3>Знайдено {{ results.length }} оголошень</h3>
      <div v-for="apt in results" :key="apt._id" class="apartment-card">
        <img :src="apt.photos?.[0] || 'https://via.placeholder.com/120x90'" alt="Фото квартири" class="apt-photo" />
        <div class="apt-info">
          <div class="apt-price">{{ apt.apartment.price.price_number }} {{ apt.apartment.price.currency }}/міс</div>
          <div class="apt-address">{{ apt.apartment.address.city }}, {{ apt.apartment.address.district }}, {{ apt.apartment.address.street }}</div>
          <div class="apt-meta">
            {{ apt.apartment.characteristics.room_count }} кімн., {{ apt.apartment.characteristics.area.total }} м², поверх {{ apt.apartment.characteristics.floor }} з {{ apt.apartment.characteristics.floors_total }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { fetchApartments } from '../api'

const filters = ref({
  rooms: '',
  priceMin: '',
  priceMax: '',
  floorMin: '',
  floorMax: '',
  areaMin: '',
  areaMax: '',
  district: '',
  allowPets: false,
  allowChildren: false,
  noCommission: false,
})

const loading = ref(false)
const error = ref(null)
const results = ref([])

async function onSearch() {
  loading.value = true
  error.value = null
  try {
    const params = {}
    if (filters.value.rooms) params['rooms'] = filters.value.rooms
    if (filters.value.priceMin) params['priceMin'] = filters.value.priceMin
    if (filters.value.priceMax) params['priceMax'] = filters.value.priceMax
    if (filters.value.floorMin) params['floorMin'] = filters.value.floorMin
    if (filters.value.floorMax) params['floorMax'] = filters.value.floorMax
    if (filters.value.areaMin) params['areaMin'] = filters.value.areaMin
    if (filters.value.areaMax) params['areaMax'] = filters.value.areaMax
    if (filters.value.district) params['district'] = filters.value.district
    if (filters.value.allowPets) params['allowPets'] = true
    if (filters.value.allowChildren) params['allowChildren'] = true
    if (filters.value.noCommission) params['noCommission'] = true
    results.value = await fetchApartments(params)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.search-view {
  padding: 16px 0 72px 0;
}
.search-form {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px #0001;
  margin: 12px 16px 24px 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.search-btn {
  background: #eab676;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
}
.apartment-card {
  display: flex;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px #0001;
  margin: 12px 16px;
  overflow: hidden;
}
.apt-photo {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 12px 0 0 12px;
}
.apt-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.apt-price {
  font-weight: bold;
  color: #b48c6e;
  font-size: 18px;
}
.apt-address {
  font-size: 14px;
  color: #444;
}
.apt-meta {
  font-size: 13px;
  color: #888;
}
</style> 
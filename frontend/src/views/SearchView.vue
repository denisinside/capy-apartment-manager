<template>
  <div class="search-view">
    <h2 class="search-title">Пошук квартири</h2>
    <form class="search-form" @submit.prevent="onSearch">
      <div class="form-row">
        <label class="form-label">Місто</label>
        <div class="custom-select" @click="showCityDropdown = !showCityDropdown">
          <span>{{ filters.city || 'Оберіть місто' }}</span>
          <svg class="dropdown-arrow" width="20" height="20" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#b48c6e" stroke-width="2" fill="none"/></svg>
          <ul v-if="showCityDropdown" class="dropdown-list">
            <li v-for="city in cities.filter(c => c)" :key="city" @click.stop="selectCity(city)">{{ city }}</li>
          </ul>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Кімнат</label>
        <div class="room-btns">
          <button v-for="n in 5" :key="n" type="button" :class="{active: filters.rooms.includes(n)}" @click="toggleRoom(n)">{{ n }}</button>
        </div>
      </div>
      <div class="form-row slider-row">
        <label class="form-label">Ціна ({{ currencyLabel }})</label>
        <div class="slider-container">
           <Slider 
             v-model="filters.priceRange" 
             :min="0" 
             :max="100000" 
             :step="1000" 
             :format="formatPriceValue" 
             showTooltip="always"
             class="price-slider"/>
        </div>
      </div>
      <div class="form-row slider-row">
        <label class="form-label">Площа (м²)</label>
         <div class="slider-container">
           <Slider 
             v-model="filters.areaRange" 
             :min="10" 
             :max="500" 
             :step="5" 
             :format="formatAreaValue"
             showTooltip="always"
             class="area-slider"/>
         </div>
       </div>
      <div class="form-row slider-row">
        <label class="form-label">Поверх</label>
         <div class="slider-container">
            <Slider 
              v-model="filters.floorRange" 
              :min="1" 
              :max="50" 
              :step="1"
              :format="formatFloorValue"
              showTooltip="always"
              class="floor-slider"/>
         </div>
       </div>
      <div class="form-row multi-select-row">
        <label class="form-label">Район</label>
        <div class="multi-select" @click="showDistricts = !showDistricts">
          <div class="tags">
            <span v-for="d in filters.districts" :key="d" class="tag">{{ d }}<span class="tag-close" @click.stop="removeTag('districts', d)">×</span></span>
            <span v-if="!filters.districts.length" class="placeholder">Оберіть район</span>
          </div>
          <svg class="dropdown-arrow" width="20" height="20" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#b48c6e" stroke-width="2" fill="none"/></svg>
          <ul v-if="showDistricts" class="dropdown-list">
            <li v-for="d in districts || []" :key="d._id" @click.stop="toggleMulti('districts', d.name)">{{ d.name }}</li>
          </ul>
        </div>
      </div>
      <div v-if="subwayStations && subwayStations.length" class="form-row multi-select-row">
        <label class="form-label">Метро</label>
        <div class="multi-select" @click="showSubway = !showSubway">
          <div class="tags">
            <span v-for="s in filters.subwayStations" :key="s" class="tag">{{ s }}<span class="tag-close" @click.stop="removeTag('subwayStations', s)">×</span></span>
            <span v-if="!filters.subwayStations.length" class="placeholder">Оберіть станцію</span>
          </div>
          <svg class="dropdown-arrow" width="20" height="20" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#b48c6e" stroke-width="2" fill="none"/></svg>
          <ul v-if="showSubway" class="dropdown-list">
            <li v-for="s in subwayStations || []" :key="s._id" @click.stop="toggleMulti('subwayStations', s.name)">{{ s.name }}</li>
          </ul>
        </div>
      </div>
      <div class="form-row multi-select-row">
        <label class="form-label">ЖК</label>
        <div class="multi-select" @click="showComplexes = !showComplexes">
          <div class="tags">
            <span v-for="rc in filters.residentialComplexes" :key="rc" class="tag">{{ rc }}<span class="tag-close" @click.stop="removeTag('residentialComplexes', rc)">×</span></span>
            <span v-if="!filters.residentialComplexes.length" class="placeholder">Оберіть ЖК</span>
          </div>
          <svg class="dropdown-arrow" width="20" height="20" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#b48c6e" stroke-width="2" fill="none"/></svg>
          <ul v-if="showComplexes" class="dropdown-list">
            <li v-for="rc in residentialComplexes || []" :key="rc._id" @click.stop="toggleMulti('residentialComplexes', rc.name)">{{ rc.name }}</li>
          </ul>
        </div>
      </div>
      <div class="form-row multi-select-row">
        <label class="form-label">Орієнтири</label>
        <div class="multi-select" @click="showLandmarks = !showLandmarks">
          <div class="tags">
            <span v-for="l in filters.landmarks" :key="l" class="tag">{{ l }}<span class="tag-close" @click.stop="removeTag('landmarks', l)">×</span></span>
            <span v-if="!filters.landmarks.length" class="placeholder">Оберіть місце</span>
          </div>
          <svg class="dropdown-arrow" width="20" height="20" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#b48c6e" stroke-width="2" fill="none"/></svg>
          <ul v-if="showLandmarks" class="dropdown-list">
            <li v-for="l in landmarks || []" :key="l._id" @click.stop="toggleMulti('landmarks', l.name)">{{ l.name }}</li>
          </ul>
        </div>
      </div>
      <div class="form-row icon-filters-row">
        <button type="button" class="icon-filter-btn" :class="{active: filters.allowPets}" @click="filters.allowPets = !filters.allowPets">
          <span class="btn-icon">🐾</span>
          <span>З тваринами</span>
        </button>
        <button type="button" class="icon-filter-btn" :class="{active: filters.allowChildren}" @click="filters.allowChildren = !filters.allowChildren">
          <span class="btn-icon">👨‍👩‍👧‍👦</span>
          <span>З дітьми</span>
        </button>
        <button type="button" class="icon-filter-btn" :class="{active: filters.noCommission}" @click="toggleNoCommission">
          <span class="btn-icon">✅</span>
          <span>Без комісії</span>
        </button>
      </div>
      <div v-if="!filters.noCommission" class="form-row commission-row">
         <label class="form-label">Комісія (%)</label>
        <div class="input-group commission-group">
          <input v-model.number="filters.commissionRateMin" type="number" placeholder="від" min="0" />
          <input v-model.number="filters.commissionRateMax" type="number" placeholder="до" min="0" />
        </div>
      </div>
      <div v-if="validationErrors.length" class="validation-errors">
        <div v-for="err in validationErrors" :key="err" class="validation-error">{{ err }}</div>
      </div>
      <button class="search-btn" type="submit" :disabled="isLoading">{{ submitButtonText }}</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Slider from '@vueform/slider'
import { fetchCities, fetchDistricts, fetchSubwayStations, fetchResidentialComplexes, fetchLandmarks, fetchRieltors, fetchAgencies, createSubscription, updateSubscription } from '../api'
import { useCityStore } from '../stores/city'
import { useTelegram } from '../useTelegram'
import { useSubscriptionsStore } from '../stores/subscriptions'

import '@vueform/slider/themes/default.css'

const router = useRouter()
const route = useRoute()
const cityStore = useCityStore()
const { user, tg } = useTelegram()
const subscriptionsStore = useSubscriptionsStore()

const userId = user?.value?.id || 'test-user'

const editingSubscriptionId = computed(() => route.query.editingSubscriptionId)
const isEditing = computed(() => !!editingSubscriptionId.value)

const defaultCity = 'Київ';

const filters = ref({
  city: cityStore.city || defaultCity,
  rooms: [],
  priceRange: [0, 70000],
  currency: 'Uah',
  areaRange: [20, 200],
  floorRange: [1, 25],
  districts: [],
  subwayStations: [],
  residentialComplexes: [],
  landmarks: [],
  rieltors: [],
  agencies: [],
  allowPets: false,
  allowChildren: false,
  bargain: false,
  noCommission: false,
  commissionRateMin: '',
  commissionRateMax: ''
})

const cities = ref([])
const districts = ref([])
const subwayStations = ref([])
const residentialComplexes = ref([])
const landmarks = ref([])
const rieltors = ref([])
const agencies = ref([])

const showCityDropdown = ref(false)
const showDistricts = ref(false)
const showSubway = ref(false)
const showComplexes = ref(false)
const showLandmarks = ref(false)
const showRieltors = ref(false)
const showAgencies = ref(false)

const currencies = [
  { value: 'Uah', label: 'грн' },
  { value: 'Usd', label: '$' },
  { value: 'Eur', label: '€' }
]
const currencyLabel = computed(() => currencies.find(c => c.value === filters.value.currency)?.label || 'грн')

const validationErrors = ref([])
const isLoading = ref(false)
const submitButtonText = computed(() => isEditing.value ? 'Зберегти підписку' : 'Знайти квартири')

const formatPriceValue = (value) => {
  return `${Math.round(value).toLocaleString('uk-UA')}`;
};
const formatAreaValue = (value) => {
  return `${Math.round(value)} м²`;
};
const formatFloorValue = (value) => {
  return `${Math.round(value)}`;
};

function validateForm() {
  validationErrors.value = []
  if (!filters.value.noCommission) {
    if (filters.value.commissionRateMin < 0) validationErrors.value.push('Мінімальна комісія не може бути відʼємною')
    if (filters.value.commissionRateMax < 0) validationErrors.value.push('Максимальна комісія не може бути відʼємною')
    if (filters.value.commissionRateMin && filters.value.commissionRateMax && filters.value.commissionRateMin > filters.value.commissionRateMax) validationErrors.value.push('Мінімальна комісія не може бути більшою за максимальну')
  }
  return validationErrors.value.length === 0
}

async function selectCity(city) {
  if (!city) {
      showCityDropdown.value = false;
      return;
  }
  filters.value.city = city
  cityStore.setCity(city)
  showCityDropdown.value = false
  await fetchAllOptions()
  filters.value.districts = []
  filters.value.subwayStations = []
  filters.value.residentialComplexes = []
  filters.value.landmarks = []
}

function toggleRoom(n) {
  const idx = filters.value.rooms.indexOf(n)
  if (idx === -1) filters.value.rooms.push(n)
  else filters.value.rooms.splice(idx, 1)
}
function toggleMulti(field, value) {
  const arr = filters.value[field]
  const idx = arr.indexOf(value)
  if (idx === -1) arr.push(value)
  else arr.splice(idx, 1)
}
function removeTag(field, value) {
  const arr = filters.value[field]
  const idx = arr.indexOf(value)
  if (idx !== -1) arr.splice(idx, 1)
}

function toggleNoCommission() {
    filters.value.noCommission = !filters.value.noCommission;
    if (filters.value.noCommission) {
        filters.value.commissionRateMin = '';
        filters.value.commissionRateMax = '';
    }
}

async function fetchAllOptions() {
  const selectedCity = filters.value.city || defaultCity;
  if (!filters.value.city) {
      filters.value.city = defaultCity;
  }
  
  [
    districts.value,
    subwayStations.value,
    residentialComplexes.value,
    landmarks.value,
    rieltors.value,
    agencies.value
  ] = await Promise.all([
    fetchDistricts(selectedCity).then(r => r.data || []),
    fetchSubwayStations(selectedCity).then(r => r.data || []),
    fetchResidentialComplexes(selectedCity).then(r => r.data || []),
    fetchLandmarks(selectedCity).then(r => r.data || []),
    fetchRieltors(selectedCity).then(r => r.data || []),
    fetchAgencies(selectedCity).then(r => r.data || [])
  ]);
}

onMounted(async () => {
  const tg = window.Telegram?.WebApp;
  if (!(tg && tg.CloudStorage)) {
    alert('CloudStorage доступний лише у Telegram 6.1+ (WebView). Дані зберігаються лише локально.');
  }
  try {
      const res = await fetchCities();
      cities.value = (res.data || []).filter(c => c);
  } catch (error) {
      console.error("Failed to fetch cities:", error);
      cities.value = [defaultCity];
  }
  
  const queryCity = route.query.city;
  if (queryCity && cities.value.includes(queryCity)) {
      filters.value.city = queryCity;
  } else if (!filters.value.city || !cities.value.includes(filters.value.city)) {
      filters.value.city = defaultCity;
  }
  cityStore.setCity(filters.value.city);
  
  await fetchAllOptions()

  const q = route.query
  
  if (q.price) {
      try {
          const p = JSON.parse(q.price)
          filters.value.priceRange = [p.min ?? filters.value.priceRange[0], p.max ?? filters.value.priceRange[1]];
          filters.value.currency = p.currency || 'Uah'
      } catch { /* ігноруємо помилку парсингу */ }
  }
  if (q.area) {
      try {
          const a = JSON.parse(q.area)
          filters.value.areaRange = [a.min ?? filters.value.areaRange[0], a.max ?? filters.value.areaRange[1]];
      } catch {}
  }
   if (q.floor) {
      try {
          const f = JSON.parse(q.floor)
          filters.value.floorRange = [f.min ?? filters.value.floorRange[0], f.max ?? filters.value.floorRange[1]];
      } catch {}
  }
  if (q.commission) {
      try {
          const c = JSON.parse(q.commission)
          filters.value.commissionRateMin = c.rate || c.min || '';
          filters.value.commissionRateMax = c.max || '';
      } catch {}
  }
  if (q.rooms) { try { filters.value.rooms = JSON.parse(q.rooms) } catch {} }
  if (q.districts) { try { filters.value.districts = JSON.parse(q.districts) } catch {} }
  if (q.subwayStations) { try { filters.value.subwayStations = JSON.parse(q.subwayStations) } catch {} }
  if (q.residentialComplexes) { try { filters.value.residentialComplexes = JSON.parse(q.residentialComplexes) } catch {} }
  if (q.landmarks) { try { filters.value.landmarks = JSON.parse(q.landmarks) } catch {} }
  if (q.allowPets) filters.value.allowPets = q.allowPets === 'true'
  if (q.allowChildren) filters.value.allowChildren = q.allowChildren === 'true'
  if (q.bargain) filters.value.bargain = q.bargain === 'true'
  if (q.noCommission) {
      filters.value.noCommission = q.noCommission === 'true';
      if (filters.value.noCommission) {
           filters.value.commissionRateMin = '';
           filters.value.commissionRateMax = '';
      }
  }
})

async function onSearch() {
  if (!validateForm()) return

  const subscriptionOptions = {
      city: filters.value.city,
      price: {
          min: filters.value.priceRange[0] > 0 ? filters.value.priceRange[0] : undefined,
          max: filters.value.priceRange[1] < 100000 ? filters.value.priceRange[1] : undefined,
          currency: filters.value.currency || 'Uah'
      },
      area: {
          min: filters.value.areaRange[0] > 10 ? filters.value.areaRange[0] : undefined,
          max: filters.value.areaRange[1] < 500 ? filters.value.areaRange[1] : undefined,
      },
      floor: {
          min: filters.value.floorRange[0] > 1 ? filters.value.floorRange[0] : undefined,
          max: filters.value.floorRange[1] < 50 ? filters.value.floorRange[1] : undefined,
      },
      rooms: filters.value.rooms.length ? filters.value.rooms : undefined,
      districts: filters.value.districts.length ? filters.value.districts : undefined,
      subwayStations: filters.value.subwayStations.length ? filters.value.subwayStations : undefined,
      residentialComplexes: filters.value.residentialComplexes.length ? filters.value.residentialComplexes : undefined,
      landmarks: filters.value.landmarks.length ? filters.value.landmarks : undefined,
      allowPets: filters.value.allowPets || undefined,
      allowChildren: filters.value.allowChildren || undefined,
      bargain: filters.value.bargain || undefined,
      commissionRate: filters.value.noCommission ? 0 : (filters.value.commissionRateMin || undefined),
  };

  if (filters.value.noCommission) {
      subscriptionOptions.commissionRate = 0;
  }

  Object.keys(subscriptionOptions).forEach(key => {
      if (subscriptionOptions[key] === undefined) {
          delete subscriptionOptions[key];
      } else if (typeof subscriptionOptions[key] === 'object' && subscriptionOptions[key] !== null && !Array.isArray(subscriptionOptions[key])) {
          let isEmpty = true;
          Object.keys(subscriptionOptions[key]).forEach(subKey => {
              if (subscriptionOptions[key][subKey] !== undefined) {
                  isEmpty = false;
              } else {
                  delete subscriptionOptions[key][subKey];
              }
          });
          if (isEmpty) {
              delete subscriptionOptions[key];
          }
      }
  });

  isLoading.value = true;
  try {
      if (isEditing.value) {
          const result = await updateSubscription(editingSubscriptionId.value, userId, subscriptionOptions);
          console.log('Subscription updated:', result);
          await subscriptionsStore.syncFromDBIfEmpty();
          if (tg && tg.showAlert) tg.showAlert('Підписку успішно оновлено!');
          router.push({ name: 'SubscriptionSettings' });

      } else {
          const query = {};
          Object.entries(subscriptionOptions).forEach(([key, value]) => {
              if (value === undefined) return;
              if (typeof value === 'boolean') {
                  query[key] = String(value);
              } else if (Array.isArray(value)) {
                  query[key] = JSON.stringify(value);
              } else if (typeof value === 'object' && value !== null) {
                  if (key === 'commissionRate' && value === 0) {
                     query.noCommission = 'true';
                  } else {
                     query[key] = JSON.stringify(value);
                  }
              } else {
                  query[key] = String(value);
              }
          });
          if (query.noCommission === 'true') delete query.commissionRate;

          console.log("Search Query:", query);
          router.push({ name: 'results', query });
      }
  } catch (error) {
      console.error('Error during search/subscription operation:', error);
      if (tg && tg.showAlert) tg.showAlert(`Помилка: ${error.message || 'Невідома помилка'}`);
  } finally {
      isLoading.value = false;
  }
}
</script>

<style>
.slider-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
}

.slider-container {
    width: 100%;
    padding: 0 5px;
}

.price-slider, .area-slider, .floor-slider {
  --slider-connect-bg: #b48c6e; 
  --slider-tooltip-bg: #b48c6e;
  --slider-handle-ring-color: #eab67630;
  --slider-handle-bg: #b48c6e;
  --slider-handle-shadow: none;
  --slider-handle-shadow-active: none;
  --slider-handle-ring-width: 3px;
  --slider-height: 6px;
  --slider-handle-width: 16px;
  --slider-handle-height: 16px;
  margin-top: 10px;
}

.input-group input[type="number"] {
  /* display: none; - Ховаємо, коли є повзунки */ 
}

.icon-filter-btn {
  background: #ededed;
  border-radius: 8px;
  padding: 8px 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #444;
  border: 1.5px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-size: 0.95rem;
}

.icon-filter-btn .btn-icon {
    font-size: 1.3em;
    line-height: 1;
}

.icon-filter-btn.active {
  background: #eab676;
  color: #fff;
  border-color: #b48c6e;
  box-shadow: 0 2px 5px rgba(180, 140, 110, 0.3);
}
</style>

<style scoped>
.search-view {
  padding: 16px 0 72px 0;
  max-width: 480px;
  margin: 0 auto;
}
.search-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #b48c6e;
}
.search-form {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px #0002;
  margin: 12px 0 24px 0;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.form-label {
  min-width: 90px;
  font-weight: 500;
  color: #b48c6e;
  font-size: 1rem;
}
.input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}
.input-group input {
  border: 1px solid #eab676;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 1rem;
  width: 90px;
  outline: none;
  transition: border 0.2s;
}
.input-group input:focus {
  border: 1.5px solid #b48c6e;
}
.custom-select {
  position: relative;
  background: #f8f8f8;
  border: 1px solid #eab676;
  color: #111;
  border-radius: 8px;
  padding: 7px 12px;
  min-width: 120px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}
.custom-select.small {
  min-width: 60px;
  padding: 7px 8px;
}
.dropdown-arrow {
  margin-left: 4px;
  pointer-events: none;
}
.dropdown-list {
  position: absolute;
  left: 0;
  top: 110%;
  background: #fff;
  border: 1px solid #eab676;
  border-radius: 8px;
  box-shadow: 0 2px 12px #0001;
  z-index: 10;
  min-width: 100%;
  max-height: 180px;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  list-style: none;
}
.dropdown-list li {
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  color: #333;
  font-weight: 500;
}
.dropdown-list li:hover {
  background: #f5e6d6;
}
.room-btns {
  display: flex;
  gap: 8px;
}
.room-btns button {
  background: #f5f5f5;
  border: 1.5px solid #eab676;
  border-radius: 8px;
  padding: 7px 16px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border 0.2s;
}
.room-btns button.active {
  background: #eab676;
  color: #fff;
  border-color: #b48c6e;
}
.multi-select {
  position: relative;
  background: #f8f8f8;
  border: 1px solid #eab676;
  border-radius: 8px;
  min-width: 120px;
  padding: 7px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  user-select: none;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  background: #eab676;
  color: #fff;
  border-radius: 6px;
  padding: 3px 10px 3px 8px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 4px;
}
.tag-close {
  margin-left: 2px;
  font-size: 1.1em;
  cursor: pointer;
  color: #fff;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.tag-close:hover {
  opacity: 1;
}
.placeholder {
  color: #888;
  font-size: 0.97em;
}
.toggles-row, .commission-row {
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}
.toggle-group, .icon-filter-btn {
  background: #ededed;
  border-radius: 8px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 500;
  color: #444;
  border: 1.5px solid #eab676;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px #eab67622;
  font-size: 1rem;
}
.icon-filter-btn.active {
  background: linear-gradient(90deg, #eab676 0%, #b48c6e 100%);
  color: #fff;
  border-color: #b48c6e;
  box-shadow: 0 4px 16px #eab67644;
}
.icon-filter-btn svg {
  filter: grayscale(0.3);
}
.icon-filter-btn.active svg {
  filter: grayscale(0) drop-shadow(0 0 2px #fff6);
}
.icon-filters-row {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  margin-bottom: 0;
}
.commission-group input {
  width: 70px;
}
.search-btn {
  background: linear-gradient(90deg, #eab676 0%, #b48c6e 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 13px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  box-shadow: 0 2px 8px #eab67633;
  transition: background 0.2s, box-shadow 0.2s;
}
.search-btn:hover {
  background: linear-gradient(90deg, #b48c6e 0%, #eab676 100%);
  box-shadow: 0 4px 16px #eab67644;
}
.validation-errors {
  color: #b00;
  background: #fff6f6;
  border: 1px solid #fbb;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  font-size: 1rem;
}
.validation-error {
  margin-bottom: 2px;
}
@media (max-width: 600px) {
  .search-view {
    padding: 8px 0 64px 0;
    max-width: 100vw;
  }
  .search-form {
    gap: 12px;
  }
  .form-label {
    min-width: 70px;
    font-size: 0.97rem;
  }
}

/* Стиль для кнопки під час завантаження */
.search-btn[disabled] {
    background: #ccc;
    cursor: not-allowed;
    box-shadow: none;
}
</style> 
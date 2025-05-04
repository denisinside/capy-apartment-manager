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
             :step="250" 
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
             :max="150" 
             :step="2" 
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
              :max="40" 
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

// --- Subscription Bell Logic ---

// Helper to build subscription options object from filters
function buildSubscriptionOptionsFromFilters() {
    const options = {
      city: filters.value.city,
      price: {
          min: filters.value.priceRange[0] > 0 ? filters.value.priceRange[0] : undefined,
          max: filters.value.priceRange[1] < 100000 ? filters.value.priceRange[1] : undefined,
          currency: filters.value.currency || 'Uah'
      },
      area: {
          min: filters.value.areaRange[0] > 10 ? filters.value.areaRange[0] : undefined,
          max: filters.value.areaRange[1] < 500 ? filters.value.areaRange[1] : undefined, // Assuming 500 max, adjust if needed
      },
      floor: {
          min: filters.value.floorRange[0] > 1 ? filters.value.floorRange[0] : undefined,
          max: filters.value.floorRange[1] < 50 ? filters.value.floorRange[1] : undefined, // Assuming 50 max, adjust if needed
      },
      rooms: filters.value.rooms.length ? filters.value.rooms : undefined,
      districts: filters.value.districts.length ? filters.value.districts : undefined,
      subwayStations: filters.value.subwayStations.length ? filters.value.subwayStations : undefined,
      residentialComplexes: filters.value.residentialComplexes.length ? filters.value.residentialComplexes : undefined,
      landmarks: filters.value.landmarks.length ? filters.value.landmarks : undefined,
      allowPets: filters.value.allowPets || undefined,
      allowChildren: filters.value.allowChildren || undefined,
      bargain: filters.value.bargain || undefined,
      // Handle commission
      commissionRate: undefined, // Will be set below
      commissionPrice: undefined // Assuming price is not used in filters yet
  };

   if (filters.value.noCommission) {
      options.commissionRate = 0;
  } else {
      // Use commissionRateMin as the rate if provided
      if (filters.value.commissionRateMin !== '' && filters.value.commissionRateMin !== null && filters.value.commissionRateMin >= 0) {
          options.commissionRate = Number(filters.value.commissionRateMin);
      }
      // Handle commissionRateMax if needed - depends on how backend stores/matches ranges
      // If backend only stores a single rate, we might only use min.
      // If backend stores min/max, we need to pass max too.
      // Current schema seems to have only commissionRate and commissionPrice.
  }

  // Clean up undefined/empty values
  Object.keys(options).forEach(key => {
      if (options[key] === undefined) {
          delete options[key];
      } else if (typeof options[key] === 'object' && options[key] !== null && !Array.isArray(options[key])) {
          let isEmpty = true;
          Object.keys(options[key]).forEach(subKey => {
              if (options[key][subKey] !== undefined) {
                  isEmpty = false;
              } else {
                  delete options[key][subKey];
              }
          });
          if (isEmpty) {
              delete options[key];
          }
      }
  });

  return options;
}

// Re-use normalization logic from SearchResultView (could be moved to a utility file)
function normalizeOptionsForComparison(options) {
     const normalized = {};
    for (const key in options) {
        let value = options[key];
        if (value === undefined || value === null || value === '') continue; 
        // Basic normalization - assumes structure is already object-like
         if (key === 'price' || key === 'area' || key === 'floor') {
             // Ensure min/max are numbers or undefined
             const normObj = {};
             if (value.min !== undefined && value.min !== null) normObj.min = Number(value.min);
             if (value.max !== undefined && value.max !== null) normObj.max = Number(value.max);
             if (key === 'price' && value.currency) normObj.currency = value.currency;
             // Keep object only if it has keys
             if (Object.keys(normObj).length > 0) normalized[key] = normObj;
         } else if (key === 'rooms' && Array.isArray(value)) {
              normalized[key] = value.map(Number).sort(); // Ensure numbers and sort
         } else if (Array.isArray(value)) {
             normalized[key] = [...value].sort(); // Sort string arrays
         } else {
            normalized[key] = value; 
         }
    }
     // Remove empty objects that might result from normalization
    for (const key in normalized) {
       if (typeof normalized[key] === 'object' && normalized[key] !== null && !Array.isArray(normalized[key])) {
           if (Object.keys(normalized[key]).length === 0) {
               delete normalized[key];
           }
       }
    }
    return normalized;
}

function sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sortObjectKeys).sort(); 
    return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = sortObjectKeys(obj[key]);
        return acc;
    }, {});
}

const matchingSubscriptionId = computed(() => {
    const currentOptions = normalizeOptionsForComparison(buildSubscriptionOptionsFromFilters());
    const currentOptionsString = JSON.stringify(sortObjectKeys(currentOptions));
    
    const foundSub = subscriptionsStore.subscriptions.find(sub => {
        const subOptions = normalizeOptionsForComparison(sub.subscriptionOptions);
        return JSON.stringify(sortObjectKeys(subOptions)) === currentOptionsString;
    });
    return foundSub?._id || null;
});

const isSubscribedToCurrentFilters = computed(() => !!matchingSubscriptionId.value);

async function toggleSubscriptionForFilters() {
    if (!userId) return;

    if (isSubscribedToCurrentFilters.value && matchingSubscriptionId.value) {
        try {
            await subscriptionsStore.removeSubscription(matchingSubscriptionId.value);
            console.log("Subscription removed via bell");
             if (tg && tg.notificationOccurred) tg.notificationOccurred('removed'); // Haptic feedback
        } catch (error) {
            console.error("Failed to remove subscription:", error);
        }
    } else {
        const subscriptionOptions = buildSubscriptionOptionsFromFilters();
        try {
            await subscriptionsStore.addSubscription(subscriptionOptions);
            console.log("Subscription added via bell");
             if (tg && tg.notificationOccurred) tg.notificationOccurred('added'); // Haptic feedback
        } catch (error) {
            console.error("Failed to add subscription:", error);
        }
    }
}

// --- End Subscription Bell Logic ---

async function onSearch() {
  if (!validateForm()) return

  const subscriptionOptions = buildSubscriptionOptionsFromFilters(); // Use the helper

  isLoading.value = true;
  try {
      if (isEditing.value) {
          // Use store's updateSubscription
          await subscriptionsStore.updateSubscription(editingSubscriptionId.value, subscriptionOptions);
          console.log('Subscription updated via form save');
          // await subscriptionsStore.syncFromDB(); // Sync might be redundant if updateSubscription updates local state
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
  --slider-connect-bg: var(--color-button); 
  --slider-tooltip-bg: var(--color-button);
  --slider-handle-ring-color: color-mix(in srgb, var(--color-button) 30%, transparent);
  --slider-handle-bg: var(--color-button);
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
  background: var(--color-background-soft);
  border-radius: 8px;
  padding: 8px 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--color-text);
  border: 1.5px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-size: 0.95rem;
}

.icon-filter-btn .btn-icon {
    font-size: 1.3em;
    line-height: 1;
}

.icon-filter-btn.active {
  background: var(--color-button);
  color: var(--color-button-text);
  border-color: var(--color-button);
  box-shadow: 0 2px 5px color-mix(in srgb, var(--color-button) 30%, transparent);
}
</style>

<style scoped>
.search-view {
  padding: 16px 0 72px 0;
  max-width: 480px;
  margin: 0 auto;
  position: relative; /* Needed for absolute positioning of the bell */
}

.subscribe-bell-btn {
    position: absolute;
    top: 10px; /* Adjust as needed */
    right: 10px; /* Adjust as needed */
    z-index: 5; 
    /* Reuse styles from SearchResultView icon-btn */
    background: var(--color-background-soft);
    border: 1.5px solid var(--color-border);
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--color-border) 20%, transparent);
    cursor: pointer;
    transition: background 0.2s, border 0.2s, box-shadow 0.2s;
    font-size: 2rem;
    color: var(--color-text);
}

.subscribe-bell-btn.active {
    background: var(--color-button);
    border-color: var(--color-button);
    color: var(--color-button-text);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--color-button) 30%, transparent);
}

.search-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--color-accent);
}
.search-form {
  background: var(--color-section-bg);
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
  color: var(--color-text-secondary);
  font-size: 1rem;
}
.input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}
.input-group input {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 1rem;
  width: 90px;
  outline: none;
  transition: border 0.2s;
  background-color: var(--color-background);
  color: var(--color-text);
}
.input-group input:focus {
  border: 1.5px solid var(--color-link);
}
.custom-select {
  position: relative;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  color: var(--color-text);
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
.custom-select svg path {
    stroke: var(--color-hint-color);
}
.dropdown-arrow {
  margin-left: 4px;
  pointer-events: none;
}
.dropdown-list {
  position: absolute;
  left: 0;
  top: 110%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
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
  color: var(--color-text);
  font-weight: 500;
}
.dropdown-list li:hover {
  background: var(--color-background-mute);
}
.room-btns {
  display: flex;
  gap: 8px;
}
.room-btns button {
  background: var(--color-background-soft);
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  padding: 7px 16px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border 0.2s;
  color: var(--color-text);
}
.room-btns button.active {
  background: var(--color-button);
  color: var(--color-button-text);
  border-color: var(--color-button);
}
.multi-select {
  position: relative;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
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
  background: var(--color-button);
  color: var(--color-button-text);
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
  color: var(--color-button-text);
  opacity: 0.7;
  transition: opacity 0.2s;
}
.tag-close:hover {
  opacity: 1;
}
.placeholder {
  color: var(--color-text-secondary);
  font-size: 0.97em;
}
.toggles-row, .commission-row {
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}
.toggle-group, .icon-filter-btn {
  background: var(--color-background-soft);
  border-radius: 8px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 500;
  color: var(--color-text);
  border: 1.5px solid var(--color-border);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-border) 20%, transparent);
  font-size: 1rem;
}
.icon-filter-btn.active {
  background: var(--color-button);
  color: var(--color-button-text);
  border-color: var(--color-button);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-button) 30%, transparent);
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
  background: var(--color-button);
  color: var(--color-button-text);
  border: none;
  border-radius: 10px;
  padding: 13px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-button) 20%, transparent);
  transition: background 0.2s, box-shadow 0.2s;
}
.search-btn:hover {
  background: color-mix(in srgb, var(--color-button) 85%, black);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-button) 30%, transparent);
}
.validation-errors {
  color: var(--color-destructive);
  background: color-mix(in srgb, var(--color-destructive) 10%, var(--color-background));
  border: 1px solid color-mix(in srgb, var(--color-destructive) 50%, var(--color-background));
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
    background: var(--color-text-secondary);
    cursor: not-allowed;
    box-shadow: none;
}
</style> 
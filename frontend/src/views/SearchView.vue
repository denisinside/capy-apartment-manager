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
            <li v-for="city in cities || []" :key="city" @click.stop="selectCity(city)">{{ city }}</li>
          </ul>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Кімнат</label>
        <div class="room-btns">
          <button v-for="n in 5" :key="n" type="button" :class="{active: filters.rooms.includes(n)}" @click="toggleRoom(n)">{{ n }}</button>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Ціна</label>
        <div class="input-group">
          <input v-model.number="filters.priceMin" type="number" placeholder="від" min="0" />
          <input v-model.number="filters.priceMax" type="number" placeholder="до" min="0" />
          <div class="custom-select small" @click="showCurrencyDropdown = !showCurrencyDropdown">
            <span>{{ currencyLabel }}</span>
            <svg class="dropdown-arrow" width="20" height="20" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#b48c6e" stroke-width="2" fill="none"/></svg>
            <ul v-if="showCurrencyDropdown" class="dropdown-list">
              <li v-for="c in currencies" :key="c.value" @click.stop="selectCurrency(c.value)">{{ c.label }}</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Площа (м²)</label>
        <div class="input-group">
        <input v-model.number="filters.areaMin" type="number" placeholder="від" min="0" />
        <input v-model.number="filters.areaMax" type="number" placeholder="до" min="0" />
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Поверх</label>
        <div class="input-group">
          <input v-model.number="filters.floorMin" type="number" placeholder="від" min="0" />
          <input v-model.number="filters.floorMax" type="number" placeholder="до" min="0" />
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
      <!-- Кнопки-фільтри з іконками -->
      <div class="form-row icon-filters-row">
        <button type="button" class="icon-filter-btn" :class="{active: filters.allowPets}" @click="filters.allowPets = !filters.allowPets">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7.5 10.5C8.32843 10.5 9 9.82843 9 9C9 8.17157 8.32843 7.5 7.5 7.5C6.67157 7.5 6 8.17157 6 9C6 9.82843 6.67157 10.5 7.5 10.5Z" stroke="#5a5a5a" stroke-width="1.5"/><path d="M16.5 10.5C17.3284 10.5 18 9.82843 18 9C18 8.17157 17.3284 7.5 16.5 7.5C15.6716 7.5 15 8.17157 15 9C15 9.82843 15.6716 10.5 16.5 10.5Z" stroke="#5a5a5a" stroke-width="1.5"/><path d="M12 21C14.7614 21 17 18.7614 17 16C17 13.2386 14.7614 11 12 11C9.23858 11 7 13.2386 7 16C7 18.7614 9.23858 21 12 21Z" stroke="#5a5a5a" stroke-width="1.5"/><path d="M4 15C4 13.3431 5.34315 12 7 12" stroke="#5a5a5a" stroke-width="1.5"/><path d="M20 15C20 13.3431 18.6569 12 17 12" stroke="#5a5a5a" stroke-width="1.5"/></svg>
          <span>Можна з тваринами</span>
        </button>
        <button type="button" class="icon-filter-btn" :class="{active: filters.allowChildren}" @click="filters.allowChildren = !filters.allowChildren">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#5a5a5a" stroke-width="1.5"/><path d="M4 20C4 16.6863 7.13401 14 11 14H13C16.866 14 20 16.6863 20 20" stroke="#5a5a5a" stroke-width="1.5"/></svg>
          <span>Можна з дітьми</span>
        </button>
        <button type="button" class="icon-filter-btn" :class="{active: filters.noCommission}" @click="filters.noCommission = !filters.noCommission">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 17V7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17Z" stroke="#5a5a5a" stroke-width="1.5"/><path d="M8 9H16" stroke="#5a5a5a" stroke-width="1.5"/><path d="M8 13H12" stroke="#5a5a5a" stroke-width="1.5"/></svg>
          <span>Без комісії</span>
        </button>
      </div>
      <div class="form-row commission-row">
        <div class="input-group commission-group">
          <input v-model.number="filters.commissionMin" type="number" placeholder="Комісія від" min="0" />
          <input v-model.number="filters.commissionMax" type="number" placeholder="до" min="0" />
        </div>
      </div>
      <div v-if="validationErrors.length" class="validation-errors">
        <div v-for="err in validationErrors" :key="err" class="validation-error">{{ err }}</div>
    </div>
      <button class="search-btn" type="submit">Знайти</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchCities, fetchDistricts, fetchSubwayStations, fetchResidentialComplexes, fetchLandmarks, fetchRieltors, fetchAgencies } from '../api'
import { useCityStore } from '../stores/city'

const router = useRouter()
const route = useRoute()
const cityStore = useCityStore()

const filters = ref({
  city: cityStore.city,
  rooms: [],
  priceMin: '',
  priceMax: '',
  currency: 'Uah',
  areaMin: '',
  areaMax: '',
  floorMin: '',
  floorMax: '',
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
  commissionMin: '',
  commissionMax: ''
})

const cities = ref([])
const districts = ref([])
const subwayStations = ref([])
const residentialComplexes = ref([])
const landmarks = ref([])
const rieltors = ref([])
const agencies = ref([])

const showCityDropdown = ref(false)
const showCurrencyDropdown = ref(false)
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

function validateForm() {
  validationErrors.value = []
  // Ціна
  if (filters.value.priceMin < 0) validationErrors.value.push('Мінімальна ціна не може бути відʼємною')
  if (filters.value.priceMax < 0) validationErrors.value.push('Максимальна ціна не може бути відʼємною')
  if (filters.value.priceMin && filters.value.priceMax && filters.value.priceMin > filters.value.priceMax) validationErrors.value.push('Мінімальна ціна не може бути більшою за максимальну')
  // Площа
  if (filters.value.areaMin < 0) validationErrors.value.push('Мінімальна площа не може бути відʼємною')
  if (filters.value.areaMax < 0) validationErrors.value.push('Максимальна площа не може бути відʼємною')
  if (filters.value.areaMin && filters.value.areaMax && filters.value.areaMin > filters.value.areaMax) validationErrors.value.push('Мінімальна площа не може бути більшою за максимальну')
  // Поверх
  if (filters.value.floorMin < 0) validationErrors.value.push('Мінімальний поверх не може бути відʼємним')
  if (filters.value.floorMax < 0) validationErrors.value.push('Максимальний поверх не може бути відʼємним')
  if (filters.value.floorMin && filters.value.floorMax && filters.value.floorMin > filters.value.floorMax) validationErrors.value.push('Мінімальний поверх не може бути більшим за максимальний')
  // Комісія
  if (filters.value.commissionMin < 0) validationErrors.value.push('Мінімальна комісія не може бути відʼємною')
  if (filters.value.commissionMax < 0) validationErrors.value.push('Максимальна комісія не може бути відʼємною')
  if (filters.value.commissionMin && filters.value.commissionMax && filters.value.commissionMin > filters.value.commissionMax) validationErrors.value.push('Мінімальна комісія не може бути більшою за максимальну')
  return validationErrors.value.length === 0
}

async function selectCity(city) {
  filters.value.city = city
  showCityDropdown.value = false
  await fetchAllOptions()
  // Скидаємо залежні фільтри після оновлення довідників
  filters.value.districts = []
  filters.value.subwayStations = []
  filters.value.residentialComplexes = []
  filters.value.landmarks = []
}
function selectCurrency(val) {
  filters.value.currency = val
  showCurrencyDropdown.value = false
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

async function fetchAllOptions() {
  const selectedCity = filters.value.city;
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
  // Перевірка CloudStorage
  const tg = window.Telegram?.WebApp;
  if (!(tg && tg.CloudStorage)) {
    alert('CloudStorage доступний лише у Telegram 6.1+ (WebView). Дані зберігаються лише локально.');
  }
  const res = await fetchCities()
  cities.value = res.data || []
  if (!filters.value.city && cities.value.length) filters.value.city = cities.value[0]
  await fetchAllOptions()

  // --- Встановлення фільтрів із query ---
  const q = route.query
  if (q.city) filters.value.city = q.city
  if (q.price) {
    try {
      const p = JSON.parse(q.price)
      filters.value.priceMin = p.min || ''
      filters.value.priceMax = p.max || ''
      filters.value.currency = p.currency || 'Uah'
    } catch {}
  }
  if (q.area) {
    try {
      const a = JSON.parse(q.area)
      filters.value.areaMin = a.min || ''
      filters.value.areaMax = a.max || ''
    } catch {}
  }
  if (q.commission) {
    try {
      const c = JSON.parse(q.commission)
      filters.value.commissionMin = c.min || ''
      filters.value.commissionMax = c.max || ''
    } catch {}
  }
  if (q.rooms) {
    try { filters.value.rooms = JSON.parse(q.rooms) } catch {}
  }
  if (q.districts) {
    try { filters.value.districts = JSON.parse(q.districts) } catch {}
  }
  if (q.subwayStations) {
    try { filters.value.subwayStations = JSON.parse(q.subwayStations) } catch {}
  }
  if (q.residentialComplexes) {
    try { filters.value.residentialComplexes = JSON.parse(q.residentialComplexes) } catch {}
  }
  if (q.landmarks) {
    try { filters.value.landmarks = JSON.parse(q.landmarks) } catch {}
  }
  if (q.allowPets) filters.value.allowPets = q.allowPets === 'true'
  if (q.allowChildren) filters.value.allowChildren = q.allowChildren === 'true'
  if (q.bargain) filters.value.bargain = q.bargain === 'true'
  if (q.noCommission) filters.value.noCommission = q.noCommission === 'true'
})

function onSearch() {
  if (!validateForm()) return
  const query = {}
  // Формуємо price
  query.price = JSON.stringify({
    min: filters.value.priceMin || undefined,
    max: filters.value.priceMax || undefined,
    currency: filters.value.currency || 'Uah'
  })
  // Формуємо area
  query.area = JSON.stringify({
    min: filters.value.areaMin || undefined,
    max: filters.value.areaMax || undefined
  })
  // Формуємо commission
  query.commission = JSON.stringify({
    min: filters.value.commissionMin || undefined,
    max: filters.value.commissionMax || undefined
  })
  // Масиви
  if (filters.value.rooms.length) query.rooms = JSON.stringify(filters.value.rooms)
  if (filters.value.districts.length) query.districts = JSON.stringify(filters.value.districts)
  if (filters.value.subwayStations.length) query.subwayStations = JSON.stringify(filters.value.subwayStations)
  if (filters.value.residentialComplexes.length) query.residentialComplexes = JSON.stringify(filters.value.residentialComplexes)
  if (filters.value.landmarks.length) query.landmarks = JSON.stringify(filters.value.landmarks)
  // Булеві
  query.allowPets = String(!!filters.value.allowPets)
  query.allowChildren = String(!!filters.value.allowChildren)
  query.bargain = String(!!filters.value.bargain)
  if (filters.value.noCommission) query.noCommission = 'true'
  // Місто
  if (filters.value.city) query.city = filters.value.city
  // Відправляємо
  router.push({ name: 'results', query })
}
</script>

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
    padding: 10px 2px;
    gap: 12px;
  }
  .form-label {
    min-width: 70px;
    font-size: 0.97rem;
  }
}
</style> 
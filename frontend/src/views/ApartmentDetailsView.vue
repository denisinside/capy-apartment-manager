<template>
  <div class="details-view" v-if="apartment">
    <button class="back-btn" @click="goBack" aria-label="Повернутися назад">←</button>
    <button class="fav-btn" :class="{ 'liked': liked }" @click.stop="toggleLike" @mousedown.stop @touchstart.stop>
      <span v-if="liked">❤️</span>
      <span v-else>🤍</span>
    </button>
    <div 
      class="gallery" 
      @click="openPhotoModal(galleryIndex)"
      @touchstart="touchStartGallery"
      @touchmove="touchMoveGallery"
      @touchend="touchEndGallery"
    >
      <img :src="apartment.photo[galleryIndex]" class="gallery-photo" />
      <div v-if="apartment.photo.length > 1" class="gallery-controls">
        <button @click.stop="prevPhoto">‹</button>
        <span>{{ galleryIndex + 1 }}/{{ apartment.photo.length }}</span>
        <button @click.stop="nextPhoto">›</button>
      </div>
    </div>
    <div class="main-info">
      <div class="top-row">
        <div class="address-block">
          <div class="street">{{ apartment.address.street }}{{ apartment.address.house_number ? ', ' + apartment.address.house_number : '' }}</div>
        </div>
        <div class="price-block">
          <span class="price">{{ apartment.price.price_number }}</span>
        </div>
      </div>
      <div class="sub-row">
        <div class="city-district">
          <span class="city">{{ apartment.address.city }}</span>,
          <span class="district">{{ apartment.address.district }}</span>
        </div>
        <div class="currency-block">
          <span class="currency">{{ currencySymbol }}/міс</span>
        </div>
      </div>
      <div v-if="subwayStation" class="metro-block">
        <span class="metro-icon" :style="{ background: subwayColor }">M</span>
        <span class="metro-name" :style="{ color: subwayColor }">{{ subwayStation }}</span>
      </div>
      <div class="characteristics-block">
        <span>{{ apartment.characteristics.room_count }} кімнати</span>
        <span class="dot">•</span>
        <span>{{ Math.round(apartment.characteristics.area.total) }} м²</span>
        <span class="dot">•</span>
        <span>поверх {{ apartment.characteristics.floor }} з {{ apartment.characteristics.max_floor }}</span>
      </div>
      <div v-if="(apartment.infrastructure.landmarks && apartment.infrastructure.landmarks.length) || apartment.infrastructure.residential_complex" class="landmarks-block">
        <div v-for="(landmark, index) in apartment.infrastructure.landmarks" :key="index" class="landmark">
          {{ landmark }}
        </div>
        <div v-if="apartment.infrastructure.residential_complex" class="residential-complex">
          ЖК: {{ apartment.infrastructure.residential_complex }}
        </div>
      </div>
      <div class="permits-row">
        <div class="permit-card">
          <span class="permit-icon">🐱</span>
          <span class="permit-text">
            {{ apartment.permits.allow_pets ? 'Можна з тваринами' : 'Без тварин' }}
          </span>
        </div>
        <div class="permit-card">
          <span class="permit-icon">👶</span>
          <span class="permit-text">
            {{ apartment.permits.allow_children ? 'Можна з дітьми' : 'Без дітей' }}
          </span>
        </div>
        <div class="permit-card">
          <span class="permit-icon">💸</span>
          <span class="permit-text">
            <template v-if="commissionText === 'Без комісії'">Без комісії</template>
            <template v-else>{{ commissionText }}</template>
          </span>
        </div>
      </div>
      <div class="description-block">
        <p>{{ apartment.description.advert_description }}</p>
      </div>
      <div v-if="priceHistory.length && priceHistory.length > 1" class="price-history-block">
        <h3 class="price-history-title">Історія зміни ціни</h3>
        <table class="price-history-table">
          <tbody>
            <tr v-for="(change, index) in priceHistory" :key="index">
              <td class="ph-date">
                <span v-if="index === 0 && isYesterday(change.timestamp)">вчора</span>
                <span v-else>{{ formatDate(change.timestamp) }}</span>
              </td>
              <td class="ph-diff">
                <template v-if="index < priceHistory.length - 1">
                  <span :class="priceDiffClass(change, priceHistory[index+1])">
                    {{ priceDiffText(change, priceHistory[index+1]) }}
                  </span>
                </template>
              </td>
              <td class="ph-price">
                <b>{{ change.price_number.toLocaleString() }}</b> <span class="ph-currency">{{ currencySymbol.value }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="rieltor-block">
        <img v-if="apartment.rieltor.photo" :src="apartment.rieltor.photo" class="rieltor-photo" />
        <div>
          <div class="rieltor-name">{{ apartment.rieltor.rieltor_name }}</div>
          <div class="rieltor-position">Ріелтор</div>
        </div>
      </div>
      <div class="actions-block">
        <button class="call-btn">Набрати</button>
        <button class="msg-btn">Написати</button>
      </div>
    </div>
    <div v-if="showPhotoModal" class="photo-modal" @click.self="closePhotoModal"
      @touchstart="touchStartModal"
      @touchmove="touchMoveModal"
      @touchend="touchEndModal"
    >
      <div class="modal-content">
        <button class="close-modal" @click="closePhotoModal">×</button>
        <img :src="apartment.photo[modalPhotoIndex]" class="modal-photo" />
        <div class="modal-photo-counter">{{ modalPhotoIndex + 1 }}/{{ apartment.photo.length }}</div>
        <button v-if="apartment.photo.length > 1" class="modal-prev" @click="prevModalPhoto">‹</button>
        <button v-if="apartment.photo.length > 1" class="modal-next" @click="nextModalPhoto">›</button>
      </div>
    </div>
  </div>
  <div v-else class="loading">Завантаження...</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchApartmentById } from '../api.js'
import { useFavouritesStore } from '../stores/favourites'

const route = useRoute()
const router = useRouter()
const apartment = ref(null)
const store = useFavouritesStore()
const liked = ref(false)
const galleryIndex = ref(0)
const showPhotoModal = ref(false)
const modalPhotoIndex = ref(0)
const priceHistory = ref([])

// Для свайпів у галереї
const galleryTouchStartX = ref(0)
const galleryTouchEndX = ref(0)

// Для свайпів у модалці
const modalTouchStartX = ref(0)
const modalTouchEndX = ref(0)

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await fetchApartmentById(id)
    if (res.success) {
      const data = res.data
      apartment.value = data.apartment || data
      priceHistory.value = data.price_history || []
      liked.value = store.favourites.includes(apartment.value._id)
    }
  } catch (e) {
    // handle error
  }
})

const currencySymbol = computed(() => {
  const currency = apartment.value?.price?.currency || ''
  if (currency.toLowerCase() === 'usd') return '$'
  if (currency.toLowerCase() === 'eur') return '€'
  if (currency.toLowerCase() === 'uah') return 'грн'
  return currency
})

const subwayStation = computed(() => {
  const stations = apartment.value?.infrastructure?.subway_station
  if (stations && stations.length > 0) return stations[0].name
  return null
})

const subwayColor = computed(() => {
  const stations = apartment.value?.infrastructure?.subway_station
  if (stations && stations.length > 0) {
    if (stations[0].line === 'Red') return '#e74c3c'
    if (stations[0].line === 'Green') return '#27ae60'
    if (stations[0].line === 'Blue') return '#2980b9'
  }
  return '#757575'
})

const commissionText = computed(() => {
  const commission = apartment.value?.permits?.commission
  if (!commission) return 'Без комісії'
  const rate = commission.commission_rate
  const price = commission.commission_price?.price_number
  if ((rate === 0 || rate === '0') && (!price || price === 0)) return 'Без комісії'
  if (rate && rate > 0) return `Комісія ${rate}%`
  if (price && price > 0) return `Комісія ${price} грн`
  return 'Без комісії'
})

function nextPhoto() {
  if (!apartment.value) return
  if (galleryIndex.value < apartment.value.photo.length - 1) {
    galleryIndex.value++
  } else {
    galleryIndex.value = 0
  }
}
function prevPhoto() {
  if (!apartment.value) return
  if (galleryIndex.value > 0) {
    galleryIndex.value--
  } else {
    galleryIndex.value = apartment.value.photo.length - 1
  }
}
function openPhotoModal(idx) {
  modalPhotoIndex.value = idx
  showPhotoModal.value = true
}
function closePhotoModal() {
  showPhotoModal.value = false
}
function nextModalPhoto() {
  if (!apartment.value) return
  if (modalPhotoIndex.value < apartment.value.photo.length - 1) {
    modalPhotoIndex.value++
  } else {
    modalPhotoIndex.value = 0
  }
}
function prevModalPhoto() {
  if (!apartment.value) return
  if (modalPhotoIndex.value > 0) {
    modalPhotoIndex.value--
  } else {
    modalPhotoIndex.value = apartment.value.photo.length - 1
  }
}
// --- Свайпы для галереї ---
function touchStartGallery(e) {
  galleryTouchStartX.value = e.changedTouches[0].screenX
}
function touchMoveGallery(e) {
  galleryTouchEndX.value = e.changedTouches[0].screenX
}
function touchEndGallery(e) {
  if (apartment.value?.photo?.length <= 1) return
  const diff = galleryTouchStartX.value - galleryTouchEndX.value
  if (diff > 50) {
    nextPhoto()
  } else if (diff < -50) {
    prevPhoto()
  }
}
// --- Свайпы для модалки ---
function touchStartModal(e) {
  modalTouchStartX.value = e.changedTouches[0].screenX
}
function touchMoveModal(e) {
  modalTouchEndX.value = e.changedTouches[0].screenX
}
function touchEndModal(e) {
  if (apartment.value?.photo?.length <= 1) return
  const diff = modalTouchStartX.value - modalTouchEndX.value
  if (diff > 50) {
    nextModalPhoto()
  } else if (diff < -50) {
    prevModalPhoto()
  }
}

function toggleLike() {
  if (!apartment.value) return
  liked.value = !liked.value
  const id = apartment.value._id
  if (liked.value) {
    store.addFavourite(id)
  } else {
    store.removeFavourite(id)
  }
}

function goBack() {
  router.back()
}

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('uk-UA')
}
function isYesterday(ts) {
  const d = new Date(ts)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  return d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()
}
function priceDiff(change, prev) {
  return change.price_number - prev.price_number
}
function priceDiffText(change, prev) {
  const diff = priceDiff(change, prev)
  if (diff === 0) return ''
  const sign = diff > 0 ? '+' : '-'
  return `${sign} ${Math.abs(diff).toLocaleString()} ${currencySymbol.value} ${diff > 0 ? '▲' : '▼'}`
}
function priceDiffClass(change, prev) {
  const diff = priceDiff(change, prev)
  if (diff > 0) return 'ph-up'
  if (diff < 0) return 'ph-down'
  return ''
}
</script>

<style scoped>
.details-view {
  position: relative;
  max-width: 500px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 0 0 24px 0;
}
.gallery {
  width: 100%;
  position: relative;
  background: #222;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.gallery-photo {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  display: block;
  border-bottom: 5px solid #A6844E;
}
.gallery-controls {
  position: absolute;
  bottom: 12px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  color: #fff;
  font-size: 18px;
  z-index: 2;
}
.gallery-controls button {
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 22px;
  cursor: pointer;
}
.main-info {
  padding: 18px 18px 0 18px;
}
.top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0;
}
.address-block {
  flex: 1 1 0;
  min-width: 0;
}
.price-block {
  width: 110px;
  min-width: 90px;
  text-align: right;
  flex-shrink: 0;
}
.price {
  font-size: 28px;
  font-weight: 600;
  color: #222;
  line-height: 1.1;
}
.sub-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0;
}
.city-district {
  font-size: 18px;
  color: #a00;
  line-height: 1.1;
}
.city-district span {
  font-weight: 500;
}
.currency-block {
  width: 110px;
  min-width: 90px;
  font-size: 16px;
  color: #555;
  text-align: right;
  flex-shrink: 0;
  line-height: 1.1;
}
.street {
  font-size: clamp(16px, 5vw, 28px);
  font-weight: 600;
  color: #555;
  text-align: left;
  line-height: 1.1;
  letter-spacing: -0.5px;
  width: auto;
  word-break: break-word;
  display: block;
}
.metro-block {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.metro-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.metro-name {
  font-weight: 600;
  font-size: 14px;
}
.characteristics-block {
  display: flex;
  gap: 8px;
  font-size: 15px;
  color: #333;
  margin-bottom: 10px;
  align-items: center;
}
.characteristics-block .dot {
  font-size: 10px;
  color: #bbb;
  margin: 0 4px;
  user-select: none;
}
.permits-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  margin-top: 2px;
}
.permit-card {
  background: #f5f0f0;
  border-radius: 10px;
  padding: 8px 12px 6px 10px;
  display: flex;
  align-items: center;
  min-width: 90px;
  font-size: 15px;
  font-weight: 500;
  color: #444;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.permit-icon {
  font-size: 22px;
  margin-right: 7px;
  display: flex;
  align-items: center;
}
.permit-text {
  font-size: 15px;
  font-weight: 500;
  color: #444;
  white-space: pre-line;
  line-height: 1.1;
}
.description-block {
  font-size: 15px;
  color: #444;
  margin-bottom: 8px;
}
.rieltor-block {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: 12px 18px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
}
.rieltor-photo {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}
.rieltor-name {
  font-weight: 600;
  font-size: 15px;
  color: #222;
  line-height: 1.1;
}
.rieltor-position {
  font-size: 13px;
  color: #888;
}
.actions-block {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}
.call-btn, .msg-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.call-btn {
  background: #f5c242;
  color: #222;
}
.msg-btn {
  background: #fff;
  color: #a00;
  border: 1px solid #a00;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 18px;
}

/* Модалка для фото */
.photo-modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  position: relative;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
}
.modal-photo {
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
  display: block;
  margin: auto;
  object-fit: contain;
}
.close-modal {
  position: absolute;
  top: 24px;
  right: 32px;
  background: none;
  border: none;
  color: #fff;
  font-size: 40px;
  cursor: pointer;
  z-index: 2;
  padding: 0 10px;
  line-height: 1;
}
.modal-photo-counter {
  color: #fff;
  background: rgba(0,0,0,0.5);
  border-radius: 8px;
  padding: 2px 10px;
  font-size: 15px;
  margin-top: 10px;
  font-weight: 500;
}
.modal-prev, .modal-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.7);
  color: #fff;
  border: none;
  font-size: 40px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  opacity: 0.9;
}
.modal-prev:hover, .modal-next:hover {
  background: rgba(0,0,0,1);
}
.modal-prev {
  left: 16px;
}
.modal-next {
  right: 16px;
}
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
.fav-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  z-index: 20;
  padding: 4px;
}
.fav-btn.liked span {
  color: #e74c3c;
}
.landmarks-block {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.landmark, .residential-complex {
  background: #f5f0f0;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 14px;
  color: #444;
}
.price-history-block {
  margin: 24px 0 0 0;
  color: #222;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 0 0 0 0;
}
.price-history-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  padding: 0 0 0 0;
}
.price-history-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 1.1rem;
}
.price-history-table tr {
  border-bottom: 1px solid #ececec;
}
.price-history-table tr:last-child {
  border-bottom: none;
}
.ph-date {
  color: #888;
  padding: 8px 0 8px 0;
  min-width: 110px;
  font-size: 1rem;
}
.ph-diff {
  min-width: 120px;
  font-weight: 600;
  font-size: 1.1rem;
  text-align: left;
}
.ph-up {
  color: #e74c3c;
}
.ph-down {
  color: #27ae60;
}
.ph-price {
  font-weight: 700;
  font-size: 1.2rem;
  text-align: right;
  min-width: 120px;
}
.ph-currency {
  font-weight: 500;
  font-size: 1rem;
  color: #222;
}
</style> 
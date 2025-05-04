<template>
  <div>
    <div 
      class="apartment-card" 
      @click="goToDetails" 
      :class="{ 'inactive': !isActive }"
    >
      <div 
        class="photo-container" 
        @touchstart="touchStart" 
        @touchmove="touchMove" 
        @touchend="touchEnd"
        @click.stop="onPhotoTap"
      >
        <div class="photos" :style="{ transform: `translateX(-${currentPhotoIndex * 100}%)` }">
          <img 
            v-for="(photo, index) in photos" 
            :key="index" 
            :src="photo" 
            alt="Фото квартири" 
            class="apt-photo" 
          />
        </div>
        <div v-if="photos.length > 1" class="photo-counter">
          {{ currentPhotoIndex + 1 }}/{{ photos.length }}
        </div>
        <button class="like-btn" :class="{ 'liked': liked }" @click.stop="toggleLike" @mousedown.stop @touchstart.stop @touchmove.stop @touchend.stop>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <div v-if="!isActive" class="sold-overlay">
          <span>ЗДАНО</span>
        </div>
      </div>

      <div class="info-container">
        <div class="price">{{ price }} <span class="currency">{{ currencySymbol }}/міс</span></div>
        <div class="address">
          <span class="city">{{ address.city }}</span>
          <span class="district">{{ address.district }}</span>
        </div>
        <div class="street">{{ address.street }}{{ address.house_number ? ', ' + address.house_number : '' }}</div>
        <div class="characteristics">
          <div class="icon home-icon">🏠</div>
          <div class="char-text">
            <div class="rooms">{{ roomCount }} кімн., {{ areaTotal }} м²</div>
            <div class="floor">поверх {{ floor }} з {{ maxFloor }}</div>
          </div>
        </div>
        <div v-if="subwayStation" class="metro">
          <div class="icon metro-icon" :style="{ background: subwayColor }">M</div>
          <span class="metro-name" :style="{ color: subwayColor }">{{ subwayStation }}</span>
        </div>
      </div>
    </div>

    <div v-if="showPhotoModal" class="photo-modal" @click.self="closePhotoModal">
      <div class="modal-content">
        <button class="close-modal" @click="closePhotoModal">×</button>
        <img :src="photos[modalPhotoIndex]" class="modal-photo" />
        <div class="modal-photo-counter">{{ modalPhotoIndex + 1 }}/{{ photos.length }}</div>
        <button v-if="photos.length > 1" class="modal-prev" @click="prevModalPhoto">‹</button>
        <button v-if="photos.length > 1" class="modal-next" @click="nextModalPhoto">›</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFavouritesStore } from '../stores/favourites'

const props = defineProps({
  apartment: { type: Object, required: true },
  isFavourite: { type: Boolean, default: undefined }
})

const router = useRouter()
const store = useFavouritesStore()
const liked = ref(false)
const currentPhotoIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)
let swipeDetected = false
let tapStartX = 0
let tapStartY = 0
let tapStartTime = 0
let wasTouch = false

const showPhotoModal = ref(false)
const modalPhotoIndex = ref(0)

const photos = computed(() => props.apartment?.photo || [])
const isActive = computed(() => props.apartment && props.apartment.is_active !== false)

const price = computed(() => props.apartment?.price?.price_number || '')
const currencySymbol = computed(() => {
  const currency = props.apartment?.price?.currency || ''
  if (currency.toLowerCase() === 'usd') return '$'
  if (currency.toLowerCase() === 'eur') return '€'
  if (currency.toLowerCase() === 'uah') return 'грн'
  return currency
})

const address = computed(() => props.apartment?.address || {})
const roomCount = computed(() => props.apartment?.characteristics?.room_count || '')
const areaTotal = computed(() => {
  const val = props.apartment?.characteristics?.area?.total
  return val !== undefined ? Math.round(val) : ''
})
const floor = computed(() => props.apartment?.characteristics?.floor || '')
const maxFloor = computed(() => props.apartment?.characteristics?.max_floor || '')

const subwayStation = computed(() => {
  const stations = props.apartment?.infrastructure?.subway_station
  if (stations && stations.length > 0) return stations[0].name
  return null
})

const subwayColor = computed(() => {
  const stations = props.apartment?.infrastructure?.subway_station
  if (stations && stations.length > 0) {
    if (stations[0].line === 'Red') return '#e74c3c'
    if (stations[0].line === 'Green') return '#27ae60'
    if (stations[0].line === 'Blue') return '#2980b9'
  }
  return '#757575'
})

function touchStart(e) {
  const touch = e.changedTouches[0]
  touchStartX.value = touch.screenX
  tapStartX = touch.clientX
  tapStartY = touch.clientY
  tapStartTime = Date.now()
  swipeDetected = false
  wasTouch = true
}

function touchMove(e) {
  const touch = e.changedTouches[0]
  touchEndX.value = touch.screenX
  if (Math.abs(touchStartX.value - touchEndX.value) > 30) {
    swipeDetected = true
  }
}

function touchEnd(e) {
  if (photos.value.length <= 1) return
  const touch = e.changedTouches[0]
  const diff = touchStartX.value - touch.screenX
  const tapDuration = Date.now() - tapStartTime
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      nextPhoto()
    } else {
      prevPhoto()
    }
    swipeDetected = true
    return
  }
  if (tapDuration < 300 && Math.abs(tapStartY - touch.clientY) < 10) {
    handlePhotoTap(tapStartX, e.target)
  }
  setTimeout(() => { wasTouch = false }, 350)
}

function onPhotoTap(e) {
  if (photos.value.length <= 1) return
  if (wasTouch) return
  handlePhotoTap(e.offsetX, e.target)
}

function handlePhotoTap(x, target) {
  const rect = target.getBoundingClientRect()
  const relX = x - rect.left
  const width = rect.width
  if (relX < width * 0.25) {
    prevPhoto()
  } else if (relX > width * 0.75) {
    nextPhoto()
  } else {
    modalPhotoIndex.value = currentPhotoIndex.value
    showPhotoModal.value = true
  }
}

function nextPhoto() {
  if (currentPhotoIndex.value < photos.value.length - 1) {
    currentPhotoIndex.value++
  } else {
    currentPhotoIndex.value = 0
  }
}

function prevPhoto() {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  } else {
    currentPhotoIndex.value = photos.value.length - 1
  }
}

function nextModalPhoto() {
  if (modalPhotoIndex.value < photos.value.length - 1) {
    modalPhotoIndex.value++
  } else {
    modalPhotoIndex.value = 0
  }
}

function prevModalPhoto() {
  if (modalPhotoIndex.value > 0) {
    modalPhotoIndex.value--
  } else {
    modalPhotoIndex.value = photos.value.length - 1
  }
}

function closePhotoModal() {
  showPhotoModal.value = false
}

function toggleLike(e) {
  e.stopPropagation()
  liked.value = !liked.value
  if (liked.value) {
    store.addFavourite(props.apartment._id)
  } else {
    store.removeFavourite(props.apartment._id)
  }
}

function goToDetails() {
  if (isActive.value) {
    router.push({ name: 'apartment-details', params: { id: props.apartment._id } })
  }
}

onMounted(() => {
  if (props.isFavourite !== undefined) {
    liked.value = props.isFavourite
  } else {
    liked.value = store.favourites.includes(props.apartment?._id)
  }
})
</script>

<style scoped>
.apartment-card {
  display: flex;
  width: 100%;
  height: 30vh;
  min-width: 350px;
  min-height: 220px;
  max-height: 240px;
  background: var(--color-background);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  position: relative;
  margin-bottom: 10px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.apartment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.photo-container {
  width: 60%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.photos {
  display: flex;
  height: 100%;
  width: 100%;
  transition: transform 0.3s ease;
}

.apt-photo {
  min-width: 100%;
  height: 100%;
  object-fit: cover;
  flex-shrink: 0;
}

.photo-counter {
  position: absolute;
  right: 12px;
  bottom: 10px;
  background: color-mix(in srgb, var(--color-background, #000) 50%, transparent);
  color: var(--color-text, #fff);
  font-size: 13px;
  border-radius: 8px;
  padding: 2px 8px;
  z-index: 2;
  font-weight: 500;
}

.like-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-secondary-bg, var(--color-background-soft)) 70%, transparent);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  padding: 0;
  transition: background 0.2s;
}

.like-btn:hover {
  background: color-mix(in srgb, var(--color-secondary-bg, var(--color-background-soft)) 90%, transparent);
}

.like-btn svg {
  fill: none;
  stroke: var(--color-hint-color, #aaa);
  stroke-width: 1.5;
}

.like-btn.liked svg {
  fill: var(--color-destructive, #e74c3c);
  stroke: var(--color-destructive, #e74c3c);
}

.info-container {
  width: 40%;
  height: 100%;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
}

.price {
  font-weight: bold;
  font-size: 28px;
  color: var(--color-text);
  white-space: nowrap;
  display: flex;
  align-items: baseline;
  gap: 4px;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.currency {
  font-size: 14px;
  font-weight: normal;
  color: var(--color-text-secondary);
  display: inline-block;
  letter-spacing: -0.3px;
}

.address {
  color: var(--color-accent, darkred);
  line-height: 1.2;
}
.address span:first-child {
  font-size: 18px;
  font-weight: 500;
  display: block;
}
.address span:last-child {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.4px;
  white-space: nowrap;
  color: var(--color-subtitle, #555);
}

.street {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.characteristics {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}

.home-icon {
  background: var(--color-background-soft);
  font-size: 12px;
}

.char-text {
  font-size: 14px;
  color: var(--color-text);
  letter-spacing: -0.2px;
  line-height: 1.2;
}

.rooms {
  margin-bottom: 2px;
}

.floor {
  color: var(--color-text-secondary);
}

.metro {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}

.metro-icon {
  color: white;
  font-weight: 800;
  min-width: 24px;
  min-height: 24px;
  max-width: 24px;
  max-height: 24px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 50%;
}

.metro-name {
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.2px;
  line-height: 1;
}

.inactive {
  cursor: default;
  pointer-events: auto;
}

.sold-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: color-mix(in srgb, var(--tg-theme-secondary-bg-color, #000) 50%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tg-theme-text-color, white);
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 2px;
  z-index: 3;
}

.photo-modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: color-mix(in srgb, var(--color-background, #000) 85%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  position: relative;
  background: none;
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
  color: var(--color-button-text, #fff);
  font-size: 40px;
  cursor: pointer;
  z-index: 2;
  padding: 0 10px;
  line-height: 1;
}
.modal-photo-counter {
  color: var(--color-text, #fff);
  background: color-mix(in srgb, var(--color-background, #000) 50%, transparent);
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
  background: color-mix(in srgb, var(--color-background, #000) 70%, transparent);
  color: var(--color-text, #fff);
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
  background: color-mix(in srgb, var(--color-background, #000) 100%, transparent);
}
.modal-prev {
  left: 16px;
}
.modal-next {
  right: 16px;
}
</style> 
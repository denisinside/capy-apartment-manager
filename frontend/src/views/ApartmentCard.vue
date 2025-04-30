<template>
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
      <div v-if="photos.length > 1" class="photo-dots">
        <span 
          v-for="(photo, index) in photos" 
          :key="index" 
          :class="{ 'active': index === currentPhotoIndex }" 
          class="dot"
        ></span>
      </div>
      <button class="like-btn" :class="{ 'liked': liked }" @click.stop="toggleLike">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
      <div v-if="!isActive" class="sold-overlay">
        <span>ЗДАНО</span>
      </div>
    </div>

    <div class="info-container">
      <div class="price">{{ price }} {{ currencySymbol }}/міс</div>
      <div class="address">{{ address.city }}, {{ address.district }}</div>
      <div class="street">{{ address.street }}{{ address.house_number ? ', ' + address.house_number : '' }}</div>
      
      <div v-if="subwayStation" class="metro">
        <div class="icon metro-icon">M</div>
        <span class="metro-name" :style="{ color: subwayColor }">{{ subwayStation }}</span>
      </div>
      
      <div class="characteristics">
        <div class="icon home-icon">🏠</div>
        <div class="char-text">
          <div class="rooms">{{ roomCount }} кімн., {{ areaTotal }} м²</div>
          <div class="floor">поверх {{ floor }} з {{ maxFloor }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  apartment: { type: Object, required: true }
})

const router = useRouter()
const liked = ref(false)
const currentPhotoIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)

const photos = computed(() => props.apartment.photo || [])
const isActive = computed(() => props.apartment.is_active !== false)

const price = computed(() => props.apartment.price?.price_number || '')
const currencySymbol = computed(() => {
  const currency = props.apartment.price?.currency || ''
  if (currency.toLowerCase() === 'usd') return '$'
  if (currency.toLowerCase() === 'eur') return '€'
  if (currency.toLowerCase() === 'uah') return 'грн'
  return currency
})

const address = computed(() => props.apartment.address || {})
const roomCount = computed(() => props.apartment.characteristics?.room_count || '')
const areaTotal = computed(() => props.apartment.characteristics?.area?.total || '')
const floor = computed(() => props.apartment.characteristics?.floor || '')
const maxFloor = computed(() => props.apartment.characteristics?.max_floor || '')

const subwayStation = computed(() => {
  const stations = props.apartment.infrastructure?.subway_station
  if (stations && stations.length > 0) return stations[0].name
  return null
})

const subwayColor = computed(() => {
  const stations = props.apartment.infrastructure?.subway_station
  if (stations && stations.length > 0) {
    if (stations[0].line === 'червона') return '#e74c3c'
    if (stations[0].line === 'зелена') return '#27ae60'
    if (stations[0].line === 'синя') return '#2980b9'
    if (stations[0].line === 'Лук\'янівська') return '#27ae60'
    if (stations[0].line === 'Дарниця') return '#e74c3c'
    if (stations[0].line === 'Поштова площа') return '#2980b9'
  }
  return '#757575'
})

function touchStart(e) {
  touchStartX.value = e.changedTouches[0].screenX
}

function touchMove(e) {
  touchEndX.value = e.changedTouches[0].screenX
}

function touchEnd() {
  if (photos.value.length <= 1) return
  
  const diff = touchStartX.value - touchEndX.value
  
  if (diff > 50) { // swipe left
    nextPhoto()
  } else if (diff < -50) { // swipe right
    prevPhoto()
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

function toggleLike(e) {
  e.stopPropagation()
  liked.value = !liked.value
}

function goToDetails() {
  if (isActive.value) {
    router.push({ name: 'apartment-details', params: { id: props.apartment._id } })
  }
}
</script>

<style scoped>
.apartment-card {
  display: flex;
  width: 100%;
  height: 30vh;
  min-height: 180px;
  max-height: 240px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
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

.photo-dots {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
}

.dot.active {
  background: white;
}

.like-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(240, 240, 240, 0.7);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  padding: 0;
  transition: background 0.2s;
}

.like-btn:hover {
  background: rgba(240, 240, 240, 0.9);
}

.like-btn svg {
  fill: none;
  stroke: #aaa;
  stroke-width: 1.5;
}

.like-btn.liked svg {
  fill: #e74c3c;
  stroke: #e74c3c;
}

.info-container {
  width: 40%;
  height: 100%;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
}

.price {
  font-weight: bold;
  font-size: 20px;
  color: #333;
  margin-bottom: 5px;
}

.address {
  font-size: 15px;
  color: #444;
  margin-bottom: 2px;
}

.street {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.metro {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.metro-icon {
  background: #e74c3c;
  color: white;
  font-weight: bold;
}

.icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.metro-name {
  font-weight: 500;
  font-size: 14px;
}

.characteristics {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: auto;
}

.home-icon {
  background: #f5f5f5;
  font-size: 12px;
}

.char-text {
  font-size: 14px;
  color: #555;
}

.rooms {
  margin-bottom: 2px;
}

.floor {
  color: #888;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 2px;
  z-index: 3;
}
</style> 
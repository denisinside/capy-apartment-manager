<template>
  <div class="favourites-view">
    <div class="fav-header">
      <span class="fav-title">Обране</span>
      <span class="fav-sub">за твоїми запитами</span>
      <span class="fav-heart">❤️</span>
    </div>
    <div class="fav-list">
      <transition-group name="fade-fav" tag="div">
        <div v-for="apt in visibleApartments" :key="apt._id" class="fav-card-wrapper" :class="{ 'inactive': !apt.is_active }" @click="handleCardClick(apt, $event)">
          <ApartmentCard :apartment="apt.apartment" :is-favourite="true" />
          <div v-if="!apt.is_active" class="sold-overlay-fav">ЗДАНО</div>
        </div>
      </transition-group>
      <div v-if="loading" class="loading">Завантаження...</div>
      <div v-if="!loading && apartments.length === 0" class="no-results">Немає обраних квартир</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchApartmentById } from '../api'
import { useFavouritesStore } from '../stores/favourites'
import ApartmentCard from './ApartmentCard.vue'

const store = useFavouritesStore()
const apartments = ref([])
const loading = ref(false)
const visibleCount = ref(10)
const removedIds = ref([])

const visibleApartments = computed(() =>
  apartments.value
    .filter(item => !removedIds.value.includes(item._id))
    .slice(0, visibleCount.value)
)

async function loadFavourites() {
  loading.value = true
  try {
    const ids = store.favourites
    const results = []
    for (const id of ids) {
      try {
        const res = await fetchApartmentById(id)
        if (res.success && res.data) {
          const doc = res.data
          const details = doc.apartment || doc
          results.push({ _id: doc._id, apartment: details, is_active: doc.is_active })
        }
      } catch {}
    }
    apartments.value = results
  } finally {
    loading.value = false
  }
}

function handleCardClick(apt, event) {
  event.stopPropagation()
  if (!apt.is_active) {
    removedIds.value.push(apt._id)
    setTimeout(() => {
      store.removeFavourite(apt._id)
    }, 400)
  }
}

function handleScroll() {
  const scrollY = window.scrollY || window.pageYOffset
  const windowHeight = window.innerHeight
  const docHeight = document.documentElement.scrollHeight
  if (scrollY + windowHeight + 100 >= docHeight) {
    if (visibleCount.value < apartments.value.length) {
      visibleCount.value += 10
    }
  }
}

onMounted(async () => {
  await loadFavourites()
  window.addEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.favourites-view {
  min-height: 100vh;
  background: #f8f8fa;
  padding-bottom: 80px;
}
.fav-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 12px 8px 12px;
  background: #fff;
  border-bottom: 1.5px solid #eab67644;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 2px 12px #eab67611;
  position: sticky;
  top: 0;
  z-index: 10;
}
.fav-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #222;
}
.fav-sub {
  font-size: 1.1rem;
  color: #444;
  font-weight: 400;
  margin-left: 6px;
}
.fav-heart {
  font-size: 2rem;
  margin-left: auto;
  color: #eab676;
}
.fav-list {
  padding: 12px 8px 0 8px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.fav-card-wrapper {
  position: relative;
  cursor: pointer;
}
.sold-overlay-fav {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-size: 2.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  letter-spacing: 2px;
}
.fade-fav-enter-active, .fade-fav-leave-active {
  transition: opacity 0.4s;
}
.fade-fav-enter-from, .fade-fav-leave-to {
  opacity: 0;
}
.loading {
  text-align: center;
  color: #b48c6e;
  font-size: 1.1rem;
  margin: 18px 0;
}
.no-results {
  text-align: center;
  color: #b00;
  font-size: 1.1rem;
  margin: 18px 0;
}
</style> 
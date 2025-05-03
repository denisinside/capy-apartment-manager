<template>
  <div class="favourites-view">
    <div class="fav-header">
      <span class="fav-title">Обране</span>
      <span class="fav-sub">за твоїми запитами</span>
      <span class="fav-heart">❤️</span>
    </div>
    <ApartmentList :apartments="visibleApartmentsForList" :loading="loading" empty-text="Немає обраних квартир" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchApartmentById } from '../api'
import { useFavouritesStore } from '../stores/favourites'
import ApartmentCard from './ApartmentCard.vue'
import ApartmentList from '../components/ApartmentList.vue'

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

const visibleApartmentsForList = computed(() =>
  visibleApartments.value.map(item => ({
    ...item,
    is_favourite: true
  }))
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
  if (store.syncFromDB) {
    await store.syncFromDB()
  }
  await loadFavourites()
  window.addEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.favourites-view {
  min-height: 100vh;
  min-width: 350px;
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
.fade-fav-enter-active, .fade-fav-leave-active {
  transition: opacity 0.4s;
}
.fade-fav-enter-from, .fade-fav-leave-to {
  opacity: 0;
}
</style> 
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
import { useFavouritesStore } from '../stores/favourites'
import ApartmentList from '../components/ApartmentList.vue'

const store = useFavouritesStore()
const apartments = computed(() => store.favouriteApartments)
const loading = computed(() => store.loading)
const removedIds = ref([])

const visibleApartmentsForList = computed(() =>
  apartments.value.map(item => ({
    ...item,
    is_favourite: true
  }))
)

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
  }
}

onMounted(async () => {
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
  background: var(--color-header-bg);
  border-bottom: 1.5px solid var(--color-border);
  border-radius: 0 0 18px 18px;
  box-shadow: 0 2px 12px color-mix(in srgb, var(--color-border) 20%, transparent);
  position: sticky;
  top: 0;
  z-index: 10;
}
.fav-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text);
}
.fav-sub {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  font-weight: 400;
  margin-left: 6px;
}
.fav-heart {
  font-size: 2rem;
  margin-left: auto;
  color: var(--color-accent);
}
.fade-fav-enter-active, .fade-fav-leave-active {
  transition: opacity 0.4s;
}
.fade-fav-enter-from, .fade-fav-leave-to {
  opacity: 0;
}
</style> 
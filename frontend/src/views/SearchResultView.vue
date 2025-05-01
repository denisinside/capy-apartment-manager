<template>
  <div class="search-result-view">
    <div class="top-bar">
      <div class="result-count">Знайдено {{ total }} оголошень</div>
      <div class="top-actions">
        <button class="icon-btn" @click="goToSettings" title="Налаштування">⚙️</button>
        <button class="icon-btn" :class="{active: isSubscribed}" @click="toggleSubscription" title="Підписка на пошук">
          <span v-if="isSubscribed">🔔</span>
          <span v-else>🔕</span>
        </button>
      </div>
    </div>
    <div class="apartment-list">
      <ApartmentCard v-for="apt in visibleApartments" :key="apt._id" :apartment="apt.apartment" />
      <div v-if="loading" class="loading">Завантаження...</div>
      <div v-if="!loading && apartments.length === 0" class="no-results">Нічого не знайдено</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchApartments, fetchSubscriptions, createSubscription, deleteSubscription } from '../api'
import ApartmentCard from './ApartmentCard.vue'

const route = useRoute()
const router = useRouter()
const apartments = ref([])
const total = ref(0)
const loading = ref(false)
const visibleCount = ref(10)
const isSubscribed = ref(false)
const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'test-user'
const currentSubscriptionId = ref(null)
let scrollLock = false

const visibleApartments = computed(() => apartments.value.slice(0, visibleCount.value))

async function loadApartments() {
  loading.value = true
  try {
    const params = { ...route.query }
    const res = await fetchApartments(params)
    if (res.success && Array.isArray(res.data)) {
      apartments.value = res.data
      total.value = res.total !== undefined ? res.total : res.data.length
    } else {
      apartments.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
  }
}

async function checkSubscription() {
  const res = await fetchSubscriptions(userId)
  if (res.success && Array.isArray(res.data)) {
    const currentOptions = { ...route.query }
    for (const sub of res.data) {
      if (JSON.stringify(sub.subscriptionOptions) === JSON.stringify(currentOptions)) {
        isSubscribed.value = true
        currentSubscriptionId.value = sub._id
        return
      }
    }
  }
  isSubscribed.value = false
  currentSubscriptionId.value = null
}

async function toggleSubscription() {
  if (isSubscribed.value && currentSubscriptionId.value) {
    await deleteSubscription(currentSubscriptionId.value)
    isSubscribed.value = false
    currentSubscriptionId.value = null
  } else {
    const res = await createSubscription(userId, { ...route.query })
    if (res.success) {
      isSubscribed.value = true
      currentSubscriptionId.value = res.data._id
    }
  }
}

function goToSettings() {
  router.push({ name: 'search', query: { ...route.query } })
}

function handleScroll() {
  if (loading.value || scrollLock) return
  const scrollY = window.scrollY || window.pageYOffset
  const windowHeight = window.innerHeight
  const docHeight = document.documentElement.scrollHeight
  if (scrollY + windowHeight + 100 >= docHeight) {
    if (visibleCount.value < apartments.value.length) {
      scrollLock = true
      setTimeout(() => { // невелика затримка для debounce
        visibleCount.value += 10
        scrollLock = false
      }, 200)
    }
  }
}

onMounted(async () => {
  await loadApartments()
  await checkSubscription()
  window.addEventListener('scroll', handleScroll)
})

watch(() => route.query, async () => {
  visibleCount.value = 10
  await loadApartments()
  await checkSubscription()
})
</script>

<style scoped>
.search-result-view {
  /* background: #f8f8fa; */
  min-height: 100vh;
  padding-bottom: 80px;
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 12px 8px 12px;
  background: #fff;
  border-bottom: 1.5px solid #eab67644;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 2px 12px #eab67611;
  position: sticky;
  top: 0;
  z-index: 10;
}
.result-count {
  font-size: 1.2rem;
  font-weight: 600;
  color: #b48c6e;
  letter-spacing: 0.2px;
}
.top-actions {
  display: flex;
  gap: 12px;
}
.icon-btn {
  background: #fff;
  border: 1.5px solid #eab676;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px #eab67622;
  cursor: pointer;
  transition: background 0.2s, border 0.2s, box-shadow 0.2s;
  font-size: 2rem;
}
.icon-btn.active {
  background: linear-gradient(90deg, #eab676 0%, #b48c6e 100%);
  border-color: #b48c6e;
  box-shadow: 0 4px 16px #eab67644;
}
.icon-btn svg {
  pointer-events: none;
}
.apartment-list {
  padding: 12px 8px 0 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
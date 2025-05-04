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
    <ApartmentList :apartments="visibleApartments" :loading="loading" empty-text="Нічого не знайдено" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchApartments } from '../api'
import { useSubscriptionsStore } from '../stores/subscriptions'
import ApartmentList from '../components/ApartmentList.vue'

const route = useRoute()
const router = useRouter()
const apartments = ref([])
const total = ref(0)
const loading = ref(false)
const visibleCount = ref(10)
const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'test-user'
let scrollLock = false

const subscriptionsStore = useSubscriptionsStore()

const visibleApartments = computed(() => apartments.value.slice(0, visibleCount.value))

const matchingSubscription = computed(() => {
    const currentOptions = normalizeOptions({ ...route.query });
    const currentOptionsString = JSON.stringify(sortObjectKeys(currentOptions));

    const foundSub = subscriptionsStore.subscriptions.find(sub => {
        const subOptions = normalizeOptions(sub.subscriptionOptions);
        const subOptionsString = JSON.stringify(sortObjectKeys(subOptions));
        return subOptionsString === currentOptionsString;
    });
    return foundSub;
});

const currentSubscriptionId = computed(() => matchingSubscription.value?._id);
const isSubscribed = computed(() => !!currentSubscriptionId.value);

function normalizeOptions(optionsInput) {
    const options = { ...optionsInput }; // Clone to avoid modifying original
    const normalized = {};

    // Define expected structure and types
    const structure = {
        city: 'string',
        price: { min: 'number', max: 'number', currency: 'string' },
        area: { min: 'number', max: 'number' },
        floor: { min: 'number', max: 'number' },
        rooms: 'array<number>',
        districts: 'array<string>',
        subwayStations: 'array<string>',
        residentialComplexes: 'array<string>',
        landmarks: 'array<string>',
        allowPets: 'boolean',
        allowChildren: 'boolean',
        bargain: 'boolean',
        commissionRate: 'number' // We will derive this, not expect it directly
        // noCommission is handled separately below
    };

    for (const key in structure) {
        if (key === 'commissionRate') continue; // Handled later

        let value = options[key];
        const expectedConfig = structure[key];

        // Skip if value is fundamentally empty
        if (value === undefined || value === null || value === '') continue;

        // Attempt to parse if it's a string that looks like JSON
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                // Use parsed value only if it matches expected type (object/array)
                if (typeof expectedConfig === 'object' && typeof parsed === 'object' && parsed !== null) {
                    value = parsed;
                } else if (typeof expectedConfig === 'string' && expectedConfig.startsWith('array') && Array.isArray(parsed)) {
                    value = parsed;
                }
                // Don't parse simple strings like city name 'Київ'
            } catch (e) { /* Ignore parsing errors, keep original string */ }
        }

        // --- Type Coercion and Normalization ---
        if (typeof expectedConfig === 'string') {
            if (expectedConfig === 'string') {
                normalized[key] = String(value);
            } else if (expectedConfig === 'boolean') {
                if (String(value).toLowerCase() === 'true') {
                    normalized[key] = true;
                }
                // Only store true booleans for comparison simplicity?
                // Let's try storing explicit true/false if present
                // else if (String(value).toLowerCase() === 'false') {
                //     normalized[key] = false;
                // }
            } else if (expectedConfig === 'array<number>') {
                if (Array.isArray(value)) {
                    const arr = value.map(v => Number(v)).filter(n => !isNaN(n)).sort((a, b) => a - b);
                    if (arr.length > 0) normalized[key] = arr;
                }
            } else if (expectedConfig === 'array<string>') {
                if (Array.isArray(value)) {
                    const arr = value.map(String).filter(s => s).sort();
                    if (arr.length > 0) normalized[key] = arr;
                }
            }
        } else if (typeof expectedConfig === 'object') { // Handle nested objects (price, area, floor)
            const normObj = {};
            if (typeof value === 'object' && value !== null) {
                for (const subKey in expectedConfig) {
                    const subValue = value[subKey];
                    const expectedSubType = expectedConfig[subKey];
                    if (subValue !== undefined && subValue !== null && subValue !== '') {
                         if (expectedSubType === 'number') {
                             const num = Number(subValue);
                             if (!isNaN(num)) normObj[subKey] = num;
                         } else if (expectedSubType === 'string') {
                             normObj[subKey] = String(subValue);
                         }
                    }
                }
            }
            if (Object.keys(normObj).length > 0) normalized[key] = normObj;
        }
    }

    // Handle commission explicitly: query uses noCommission, stored uses commissionRate=0
    if (options.noCommission === 'true' || options.noCommission === true) {
        normalized.commissionRate = 0;
    } else if (options.commissionRate === 0) { // If stored value is already 0
         normalized.commissionRate = 0;
    } else {
        // Remove commissionRate if it's not explicitly 0
        // (assuming other rates aren't part of the subscription criteria for now)
         delete normalized.commissionRate;
    }

    // Remove potentially lingering noCommission if it exists
    delete normalized.noCommission;

    // Final cleanup: remove any keys that ended up undefined
     for (const key in normalized) {
        if (normalized[key] === undefined) {
            delete normalized[key];
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

async function toggleSubscription() {
  if (!userId) return;

  if (isSubscribed.value && currentSubscriptionId.value) {
      try {
          await subscriptionsStore.removeSubscription(currentSubscriptionId.value);
          console.log("Subscription removed");
      } catch (error) {
          console.error("Failed to remove subscription:", error);
      }
  } else {
      const subscriptionOptions = normalizeOptions({ ...route.query });
      try {
          await subscriptionsStore.addSubscription(subscriptionOptions);
          console.log("Subscription added");
      } catch (error) {
           console.error("Failed to add subscription:", error);
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
      setTimeout(() => {
        visibleCount.value += 10
        scrollLock = false
      }, 200)
    }
  }
}

onMounted(async () => {
  await subscriptionsStore.syncFromDB();
  await loadApartments()
  window.addEventListener('scroll', handleScroll)
})

watch(() => route.query, async () => {
  visibleCount.value = 10
  await loadApartments()
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
  background: var(--color-header-bg);
  border-bottom: 1.5px solid var(--color-border);
  border-radius: 0 0 18px 18px;
  box-shadow: 0 2px 12px color-mix(in srgb, var(--color-border) 20%, transparent);
  position: sticky;
  top: 0;
  z-index: 10;
}
.result-count {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.2px;
}
.top-actions {
  display: flex;
  gap: 12px;
}
.icon-btn {
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
.icon-btn.active {
  background: var(--color-button);
  border-color: var(--color-button);
  color: var(--color-button-text);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-button) 30%, transparent);
}
.icon-btn svg {
  pointer-events: none;
}
</style> 
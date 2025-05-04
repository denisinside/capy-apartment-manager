<template>
  <div class="rieltor-view">
    <BackButton />
    <div class="rieltor-block-fixed">
      <div class="rieltor-info-centered">
        <img v-if="rieltorInfo?.photo" :src="rieltorInfo.photo" class="rieltor-photo" />
        <div class="rieltor-name">{{ rieltorInfo?.rieltor_name || rieltorName }}</div>
        <div class="rieltor-position">{{ rieltorInfo?.rieltor_position }}</div>
        <div class="rieltor-agency clickable" v-if="rieltorInfo?.rieltor_agency" @click="goToAgencyPage">
          {{ rieltorInfo.rieltor_agency }}
        </div>
      </div>
      <div class="actions-block">
        <button class="call-btn" @click="callRieltor">{{ showPhoneNumber ? rieltorInfo?.rieltor_phone_number : 'Набрати' }}</button>
        <button class="msg-btn" @click="goToAgencyPage" :disabled="!rieltorInfo?.rieltor_agency">Агенція</button>
      </div>
      <div v-if="copied" class="copied-msg">Номер скопійовано!</div>
      <div class="apartment-count">Знайдено {{ apartments.length }} квартир</div>
    </div>
    <ApartmentList :apartments="apartments" :loading="loading" empty-text="Нічого не знайдено" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchApartmentsByRieltor } from '../api.js'
import ApartmentList from '../components/ApartmentList.vue'
import BackButton from '../components/BackButton.vue'
import { useTelegram } from '../useTelegram'

const route = useRoute()
const router = useRouter()
const { tg } = useTelegram()
const rieltorName = route.params.name
const apartments = ref([])
const loading = ref(false)
const rieltorInfo = ref(null)
const showPhoneNumber = ref(false)
const copied = ref(false)

function callRieltor() {
  if (!rieltorInfo.value?.rieltor_phone_number) return
  const phone = rieltorInfo.value.rieltor_phone_number
  showPhoneNumber.value = true

  navigator.clipboard.writeText(phone).then(() => {
    copied.value = true
    setTimeout(() => copied.value = false, 1200)

    try {
      window.location.href = 'tel:' + phone
    } catch (e) {
      console.error("Failed to initiate call via window.location.href:", e);
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Не вдалося ініціювати дзвінок. Номер скопійовано.')
      } else {
        alert('Не вдалося ініціювати дзвінок. Номер скопійовано.')
      }
    }

  }).catch(err => {
    console.error('Failed to copy phone number:', err)
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert('Не вдалося скопіювати номер телефону')
    } else {
      alert('Не вдалося скопіювати номер телефону')
    }
  })
}

function goToAgencyPage() {
  if (rieltorInfo.value?.rieltor_agency) {
    router.push({ name: 'agency', params: { name: rieltorInfo.value.rieltor_agency } })
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetchApartmentsByRieltor(rieltorName)
    if (res.success && Array.isArray(res.data)) {
      apartments.value = res.data
      if (res.data.length > 0) {
        // Make sure to get the correct rieltor info structure
        rieltorInfo.value = res.data[0]?.apartment?.rieltor || null
        // Fallback if name is not in the structure but passed via route
        if (rieltorInfo.value && !rieltorInfo.value.rieltor_name) {
           rieltorInfo.value.rieltor_name = rieltorName;
        }
      }
    } else {
      apartments.value = []
      rieltorInfo.value = { rieltor_name: rieltorName }; // Basic info from route param
    }
  } catch (error) {
     console.error("Failed to load rieltor data:", error);
     apartments.value = []
     rieltorInfo.value = { rieltor_name: rieltorName }; // Basic info from route param
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.rieltor-view {
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 80px;
  position: relative;
}
.rieltor-block-fixed {
  background: var(--color-section-bg);
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  margin: 0 0 18px 0;
  padding: 18px 18px 10px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  text-align: center; /* Center align text within the block */
}
.rieltor-info-centered {
  display: flex;
  flex-direction: column; /* Stack items vertically */
  align-items: center; /* Center items horizontally */
  gap: 4px; /* Adjust gap between items */
  margin-bottom: 12px; /* Add some space before actions */
}
/* Keep existing rieltor-info related styles from previous version, but adjusted */
.rieltor-photo {
  width: 60px; /* Slightly larger photo */
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 6px; /* Space below photo */
}
.rieltor-name {
  font-weight: 600;
  font-size: 18px; /* Larger name font size */
  color: var(--color-text);
  line-height: 1.2;
}
.rieltor-position {
  font-size: 14px; /* Slightly larger position font size */
  color: var(--color-text-secondary);
}
.rieltor-agency {
  font-size: 15px;
  color: var(--color-link);
  font-weight: 600;
  cursor: pointer;
  /* removed margin-left as it's centered now */
}
.clickable {
  cursor: pointer;
  text-decoration: underline;
}
.actions-block {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  justify-content: center; /* Center buttons */
}
.call-btn, .msg-btn {
  flex: 0 1 160px; /* Allow buttons to have a max width but not grow indefinitely */
  padding: 10px 0;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.call-btn {
  background: var(--color-button);
  color: var(--color-button-text);
}
.msg-btn {
  background: var(--color-background-soft);
  color: var(--color-link);
  border: 1px solid var(--color-link);
}
.msg-btn:disabled {
  background: var(--color-background-mute);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
  cursor: not-allowed;
}
.copied-msg {
  color: #27ae60;
  font-size: 1rem;
  text-align: center;
  margin-bottom: 4px;
  font-weight: 600;
}
.apartment-count {
  font-size: 1.1rem;
  color: var(--color-accent);
  font-weight: 500;
  margin-bottom: 0;
  text-align: center;
}
</style> 
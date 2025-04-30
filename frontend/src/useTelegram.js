import { ref, onMounted } from 'vue'

const tg = window.Telegram?.WebApp

const user = ref(null)
const theme = ref('light')
const isReady = ref(false)

onMounted(() => {
  if (tg) {
    user.value = tg.initDataUnsafe?.user || null
    theme.value = tg.colorScheme || 'light'
    isReady.value = true
    console.log(tg.initDataUnsafe)
  }
})

export function useTelegram() {
  return { tg, user, theme, isReady }
} 
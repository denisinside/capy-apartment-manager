import { ref } from 'vue'

let tg = null
const user = ref(null)
const theme = ref('light')
const isReady = ref(false)

function log(...args) {
  // eslint-disable-next-line no-console
  console.log('[TelegramWebApp]', ...args)
}

function initTelegram() {
  if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp
    try {
      tg.ready()
    } catch (e) {
      log('Error calling tg.ready()', e)
    }
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      user.value = tg.initDataUnsafe.user
    } else {
      log('No user in initDataUnsafe:', tg.initDataUnsafe)
    }
    theme.value = tg.colorScheme || 'light'
    isReady.value = true
  } else {
    log('Telegram WebApp not found. window.Telegram:', window.Telegram)
  }
}

export function useTelegram() {
  if (!isReady.value) {
    initTelegram()
  }
  return { tg, user, theme, isReady }
} 
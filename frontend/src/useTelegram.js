import { ref } from 'vue'

let tg = null
const user = ref(null)
const theme = ref('light')
const isReady = ref(false)
const startParam = ref(null)
const homeScreenStatus = ref('loading') // 'loading', 'unsupported', 'unknown', 'added', 'missed'

function log(...args) {
  // eslint-disable-next-line no-console
  console.log('[TelegramWebApp]', ...args)
}

function initTelegram() {
  if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp
    log('Telegram WebApp object:', window.Telegram.WebApp)
    log('Raw initData:', tg.initData)
    log('Parsed initDataUnsafe:', tg.initDataUnsafe)
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
    startParam.value = tg.initDataUnsafe?.start_param || null
    theme.value = tg.colorScheme || 'light'
    isReady.value = true
    
    checkHomeScreenStatus()

    if (tg.onEvent) {
      tg.onEvent('homeScreenAdded', () => {
        homeScreenStatus.value = 'added';
        log('Event: homeScreenAdded');
      });
    }

  } else {
    log('Telegram WebApp not found. window.Telegram:', window.Telegram)
  }
}

function clearStartParam() {
  startParam.value = null;
  log('Start param cleared.');
}

function checkHomeScreenStatus() {
  if (tg && tg.checkHomeScreenStatus) {
    log('Checking home screen status...')
    tg.checkHomeScreenStatus((status) => {
      homeScreenStatus.value = status
      log('Home screen status:', status)
    })
  } else {
    homeScreenStatus.value = 'unsupported';
    log('checkHomeScreenStatus method not available or tg not ready.')
  }
}

function addToHomeScreen() {
  if (tg && tg.addToHomeScreen) {
    log('Requesting add to home screen...')
    tg.addToHomeScreen()
  } else {
    log('addToHomeScreen method not available or tg not ready.')
  }
}

export function useTelegram() {
  if (!isReady.value) {
    initTelegram()
  }
  return { tg, user, theme, isReady, startParam, clearStartParam, homeScreenStatus, addToHomeScreen }
} 
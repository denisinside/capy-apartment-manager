<template>
  <div class="profile-bg">
    <div class="profile-view">
      <div class="profile-header">
        <div class="profile-app-title">Capy</div>
      </div>
      <div class="profile-card">
        <div class="profile-row">
          <img :src="user?.photo_url || 'https://via.placeholder.com/80'" class="profile-photo" alt="User photo" />
          <div class="profile-user-block">
            <div class="profile-name">{{ user?.first_name }} {{ user?.last_name }}</div>
            <div class="profile-username" v-if="user?.username">@{{ user?.username }}</div>
          </div>
        </div>
        <div v-if="showAddToHomeScreen" class="add-home-block">
          <button class="add-home-button" @click="triggerAddToHomeScreen">
            <img src="/img/capy-logo.png" alt="Add to Home Screen" class="add-home-icon" />
            Додайте нас на робочий стіл!
          </button>
        </div>
      </div>
      <div class="profile-menu">
        <router-link to="/safety" class="profile-menu-btn">
          <span class="profile-menu-icon">🛡️</span> Вбережіть себе від шахраїв
        </router-link>
        <router-link to="/contracts" class="profile-menu-btn">
          <span class="profile-menu-icon">📄</span> Шаблони договорів
        </router-link>
        <router-link to="/privacy" class="profile-menu-btn">
          <span class="profile-menu-icon">ℹ️</span> Політика конфіденційності
        </router-link>
        <router-link to="/contact" class="profile-menu-btn">
          <span class="profile-menu-icon">💬</span> Напишіть нам!
        </router-link>
        <button class="profile-menu-btn logout" @click="logout">
          <span class="profile-menu-icon">🚪</span> Вийти
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTelegram } from '../useTelegram'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const { user, homeScreenStatus, addToHomeScreen: tgAddToHomeScreen } = useTelegram()
const router = useRouter()

const showAddToHomeScreen = computed(() => {
  return homeScreenStatus.value === 'missed' || homeScreenStatus.value === 'unknown'
})

function logout() {
  // TODO: додати реальний логаут
  router.push('/')
}

function triggerAddToHomeScreen() {
  if (tgAddToHomeScreen) {
    tgAddToHomeScreen()
  } else {
    console.error('addToHomeScreen function not available')
  }
}
</script>

<style scoped>
.profile-bg {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
}
.profile-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
}
.profile-header {
  padding: 24px 0 8px 0;
  text-align: center;
}
.profile-app-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.profile-card {
  background: var(--color-section-bg);
  border-radius: 16px;
  box-shadow: 0 2px 8px #0001;
  margin: 0 16px 18px 16px;
  padding: 18px 16px 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.profile-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 6px;
}
.profile-user-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.profile-photo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-accent);
}
.profile-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text);
}
.profile-username {
  color: var(--color-text-secondary);
  font-size: 15px;
}
.profile-info-row {
  font-size: 16px;
  color: var(--color-text);
  gap: 8px;
}
.profile-icon {
  font-size: 18px;
  color: var(--color-accent);
}
.profile-info {
  font-size: 16px;
}
.profile-menu {
  margin: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 1;
}
.profile-menu-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 4px #0001;
  cursor: pointer;
}
.profile-menu-btn:hover {
  background: var(--color-background-mute);
}
.profile-menu-btn.logout {
  background: color-mix(in srgb, var(--color-destructive) 15%, var(--color-background-soft));
  color: var(--color-destructive);
  border: 1px solid color-mix(in srgb, var(--color-destructive) 30%, var(--color-border));
}
.profile-menu-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}
.profile-footer-bg {
  width: 100%;
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}
.profile-footer-img {
  width: 100%;
  min-height: 120px;
  object-fit: cover;
  opacity: 0.4;
  display: block;
}
n {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px 14px;
  margin: 0 16px 18px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-shadow: 0 1px 4px #0001;
}
.add-home-text {
  color: var(--color-text);
  font-size: 15px;
  font-weight: 500;
}
.add-home-button {
  background: var(--color-accent);
  color: white;
  border: none;
  width: 100%;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 12px;
}
.add-home-button:hover {
  background: color-mix(in srgb, var(--color-accent) 85%, black);
}
.add-home-icon {
  font-size: 18px;
  width: 48px;
  height: 48px;
}
</style>
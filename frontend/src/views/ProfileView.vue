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
        <div class="profile-row profile-info-row">
          <span class="profile-icon">📞</span>
          <span class="profile-info">{{ user?.phone_number || '+380 (12) 345-67-89' }}</span>
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
      <div class="profile-footer-bg">
        <img src="/skyline.png" class="profile-footer-img" alt="city" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTelegram } from '../useTelegram'
import { useRouter } from 'vue-router'
const { user } = useTelegram()
const router = useRouter()
function logout() {
  // TODO: додати реальний логаут
  router.push('/')
}
</script>

<style scoped>
.profile-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7e6d4 0%, #fff 100%);
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
  color: #b48c6e;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.profile-card {
  background: #fff;
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
  border: 2px solid #eab676;
}
.profile-name {
  font-size: 18px;
  font-weight: bold;
  color: #b48c6e;
}
.profile-username {
  color: #888;
  font-size: 15px;
}
.profile-info-row {
  font-size: 16px;
  color: #444;
  gap: 8px;
}
.profile-icon {
  font-size: 18px;
  color: #b48c6e;
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
  background: #fff;
  border: 1px solid #eab676;
  border-radius: 10px;
  padding: 12px 14px;
  color: #222;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 4px #0001;
  cursor: pointer;
}
.profile-menu-btn:hover {
  background: #f7e6d4;
}
.profile-menu-btn.logout {
  background: #ffe0e0;
  color: #c44;
  border: 1px solid #f5b6b6;
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
</style>
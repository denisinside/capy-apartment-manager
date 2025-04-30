<template>
  <div class="profile-view">
    <div class="profile-header">
      <img :src="user?.photo_url || 'https://via.placeholder.com/80'" class="profile-photo" alt="User photo" />
      <div>
        <div class="profile-name">{{ user?.first_name }} {{ user?.last_name }}</div>
        <div class="profile-username">@{{ user?.username }}</div>
      </div>
    </div>
    <div class="profile-section">
      <div>+380 (12) 345-67-89</div>
      <div>Валюта: UAH</div>
    </div>
    <div class="profile-section">
      <button class="profile-btn">Вберегти себе від шахраїв</button>
      <button class="profile-btn">Шаблони договорів</button>
      <button class="profile-btn">Політика конфіденційності</button>
      <button class="profile-btn">Напишіть нам!</button>
      <button class="profile-btn logout">Вийти</button>
    </div>
  </div>
</template>

<script setup>
import { useTelegram } from '../useTelegram'
const { user } = useTelegram()
</script>

<style scoped>
.profile-view {
  padding: 24px 0 72px 0;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0 16px 24px 16px;
}
.profile-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eab676;
}
.profile-name {
  font-size: 20px;
  font-weight: bold;
  color: #b48c6e;
}
.profile-username {
  color: #888;
  font-size: 15px;
}
.profile-section {
  margin: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.profile-btn {
  background: #f7e6d4;
  border: none;
  border-radius: 8px;
  padding: 10px;
  margin: 4px 0;
  color: #b48c6e;
  font-weight: 500;
  cursor: pointer;
  font-size: 16px;
}
.profile-btn.logout {
  background: #ffe0e0;
  color: #c44;
}
</style> 
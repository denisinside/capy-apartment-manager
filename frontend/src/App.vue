<script setup>
// Нічого не імпортуємо, бо HelloWorld та лого більше не потрібні
</script>

<template>
  <RouterView />
  <nav class="bottom-nav">
    <RouterLink to="/map" class="nav-item" title="Мапа">
      <span>🗺️</span>
    </RouterLink>
    <RouterLink to="/list" class="nav-item" title="Оголошення">
      <span>📋</span>
    </RouterLink>
    <RouterLink to="/search" class="nav-item" title="Пошук">
      <span>🔍</span>
    </RouterLink>
    <RouterLink to="/profile" class="nav-item" title="Профіль">
      <span>👤</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 56px;
  background: #fff;
  border-top: 1px solid #eee;
  z-index: 100;
}
.nav-item {
  flex: 1;
  text-align: center;
  color: #b48c6e;
  font-size: 24px;
  text-decoration: none;
  padding: 8px 0;
}
.nav-item.router-link-exact-active {
  color: #eab676;
  font-weight: bold;
}
</style>

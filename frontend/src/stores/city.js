import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

const tg = window.Telegram?.WebApp;

function getTelegramStorageCity() {
  try {
    if (tg && tg.CloudStorage) {
      return tg.CloudStorage.getItem('city') || 'Київ';
    }
    return localStorage.getItem('city') || 'Київ';
  } catch {
    return 'Київ';
  }
}

function setTelegramStorageCity(city) {
  try {
    if (tg && tg.CloudStorage) {
      tg.CloudStorage.setItem('city', city);
    } else {
      localStorage.setItem('city', city);
    }
  } catch {}
}

export const useCityStore = defineStore('city', () => {
  const city = ref(getTelegramStorageCity());

  function setCity(newCity) {
    city.value = newCity;
    setTelegramStorageCity(newCity);
  }

  // Автоматично зберігати при зміні
  watch(city, (val) => setTelegramStorageCity(val));

  return { city, setCity };
}); 
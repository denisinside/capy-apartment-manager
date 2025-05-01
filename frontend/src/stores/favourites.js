import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

const tg = window.Telegram?.WebApp;

function getTelegramStorageFavourites() {
  try {
    if (tg && tg.CloudStorage) {
      const raw = tg.CloudStorage.getItem('favourites');
      return raw ? JSON.parse(raw) : [];
    }
    return JSON.parse(localStorage.getItem('favourites') || '[]');
  } catch {
    return [];
  }
}

function setTelegramStorageFavourites(favourites) {
  try {
    const raw = JSON.stringify(favourites);
    if (tg && tg.CloudStorage) {
      tg.CloudStorage.setItem('favourites', raw);
    } else {
      localStorage.setItem('favourites', raw);
    }
  } catch {}
}

export const useFavouritesStore = defineStore('favourites', () => {
  const favourites = ref(getTelegramStorageFavourites());

  function addFavourite(apartmentId) {
    if (!favourites.value.includes(apartmentId)) {
      favourites.value.push(apartmentId);
    }
  }

  function removeFavourite(apartmentId) {
    favourites.value = favourites.value.filter(id => id !== apartmentId);
  }

  function setFavourites(list) {
    favourites.value = list;
  }

  watch(favourites, (val) => setTelegramStorageFavourites(val), { deep: true });

  return { favourites, addFavourite, removeFavourite, setFavourites };
}); 
import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useTelegram } from '../useTelegram';
import { fetchFavourites, addToFavourites, removeFromFavourites } from '../api';

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
  const { user } = useTelegram();
  const userId = user?.value?.id || 'test-user';
  const favourites = ref(getTelegramStorageFavourites());

  async function syncFromDB() {
    console.log('syncFromDB', userId);
    if (userId) {
      try {
        console.log('syncFromDB try', userId);
        const res = await fetchFavourites(userId);
        console.log('syncFromDB res', res);
        console.log('syncFromDB res.data', res.data);
        console.log('Array.isArray(res.data)', Array.isArray(res.data));
        console.log('res.success', res.success);
        if (res.success && Array.isArray(res.data.favourites)) {
          favourites.value = res.data.favourites;
        }
      } catch {}
    }
  }

  async function addFavourite(apartmentId) {
    if (!favourites.value.includes(apartmentId)) {
      try {
        await addToFavourites(userId, apartmentId);
        favourites.value.push(apartmentId);
      } catch {}
    }
  }

  async function removeFavourite(apartmentId) {
    try {
      await removeFromFavourites(userId, apartmentId);
      favourites.value = favourites.value.filter(id => id !== apartmentId);
    } catch {}
  }

  function setFavourites(list) {
    favourites.value = list;
  }

  watch(favourites, (val) => {
    setTelegramStorageFavourites(val)
  }, { deep: true });

  syncFromDB();

  let isSyncing = false;
  watch(favourites, (val) => {
    if (!isSyncing) setTelegramStorageFavourites(val)
    isSyncing = false;
  }, { deep: true });

  return { favourites, addFavourite, removeFavourite, setFavourites, syncFromDBIfEmpty: syncFromDB };
}); 
import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useTelegram } from '../useTelegram';
import { fetchFavourites, addToFavourites, removeFromFavourites } from '../api';

const tg = window.Telegram?.WebApp;

export const useFavouritesStore = defineStore('favourites', () => {
  const { user } = useTelegram();
  const userId = user?.value?.id || 'test-user';
  const favourites = ref([]);

  async function syncFromDB() {
    if (!userId || favourites.value.length > 0) return;
    try {
      const res = await fetchFavourites(userId);
      let favs = [];
      if (res.success && Array.isArray(res.data.favourites)) favs = res.data.favourites;
      else if (Array.isArray(res)) favs = res;
      else if (res.favourites && Array.isArray(res.favourites)) favs = res.favourites;
      favourites.value = favs;
    } catch {};
  }

  async function addFavourite(apartmentId) {
    if (!favourites.value.includes(apartmentId))
      try {
        await addToFavourites(userId, apartmentId);
        favourites.value.push(apartmentId);
      } catch {}
  }

  async function removeFavourite(apartmentId) {
    if (favourites.value.includes(apartmentId))
      try {
        await removeFromFavourites(userId, apartmentId);
        favourites.value = favourites.value.filter(id => id !== apartmentId);
      } catch {}
  }

  // Автоматична синхронізація з БД при ініціалізації
  syncFromDB();

  return { favourites, syncFromDB, addFavourite, removeFavourite };
}); 
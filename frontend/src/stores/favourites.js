import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useTelegram } from '../useTelegram';
import { fetchFavouriteApartments, addToFavourites, removeFromFavourites, fetchApartmentById } from '../api';

export const useFavouritesStore = defineStore('favourites', () => {
  const { user } = useTelegram();
  const userId = user?.value?.id || 'test-user';
  const favourites = ref([]); // array of apartment IDs
  const favouriteApartments = ref([]); // array of { _id, apartment, is_active, is_favourite }
  const loading = ref(false);

  async function syncFromDB() {
    if (!userId) return;
    loading.value = true;
    try {
      const res = await fetchFavouriteApartments(userId);
      let apts = [];
      if (res.success && Array.isArray(res.data)) {
        apts = res.data.map(doc => ({
          _id: doc._id,
          apartment: doc.apartment,
          is_active: doc.is_active,
          is_favourite: true
        }));
      }
      favouriteApartments.value = apts;
      favourites.value = apts.map(a => a._id);
    } catch (err) {
      console.error('[FavouritesStore] syncFromDB error:', err);
    } finally {
      loading.value = false;
    }
  }

  async function addFavourite(apartmentId) {
    if (!favourites.value.includes(apartmentId)) {
      try {
        await addToFavourites(userId, apartmentId);
        favourites.value.push(apartmentId);
        const res = await fetchApartmentById(apartmentId);
        let doc = res.data || res;
        let details = doc.apartment || doc;
        favouriteApartments.value.push({
          _id: apartmentId,
          apartment: details,
          is_active: doc.is_active,
          is_favourite: true
        });
      } catch (err) {
        console.error('[FavouritesStore] addFavourite error:', err);
      }
    }
  }

  async function removeFavourite(apartmentId) {
    if (favourites.value.includes(apartmentId)) {
      try {
        await removeFromFavourites(userId, apartmentId);
        favourites.value = favourites.value.filter(id => id !== apartmentId);
        favouriteApartments.value = favouriteApartments.value.filter(a => a._id !== apartmentId);
      } catch (err) {
        console.error('[FavouritesStore] removeFavourite error:', err);
      }
    }
  }

  syncFromDB();

  return { favourites, favouriteApartments, loading, syncFromDB, addFavourite, removeFavourite };
}); 
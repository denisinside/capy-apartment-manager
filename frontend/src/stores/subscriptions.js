import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useTelegram } from '../useTelegram';
import { fetchSubscriptions, createSubscription, deleteSubscription } from '../api';

const tg = window.Telegram?.WebApp;

function getTelegramStorageSubscriptions() {
  try {
    if (tg && tg.CloudStorage) {
      const raw = tg.CloudStorage.getItem('subscriptions');
      return raw ? JSON.parse(raw) : [];
    }
    return JSON.parse(localStorage.getItem('subscriptions') || '[]');
  } catch {
    return [];
  }
}

function setTelegramStorageSubscriptions(subscriptions) {
  try {
    const raw = JSON.stringify(subscriptions);
    if (tg && tg.CloudStorage) {
      tg.CloudStorage.setItem('subscriptions', raw);
    } else {
      localStorage.setItem('subscriptions', raw);
    }
  } catch {}
}

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const { user } = useTelegram();
  const userId = user?.value?.id || 'test-user';
  const subscriptions = ref(getTelegramStorageSubscriptions());

  async function syncFromDBIfEmpty() {
    if (!subscriptions.value.length && userId) {
      try {
        const res = await fetchSubscriptions(userId);
        if (res.success && Array.isArray(res.data)) {
          subscriptions.value = res.data;
        }
      } catch {}
    }
  }

  async function addSubscription(subscriptionOptions) {
    try {
      await createSubscription(userId, subscriptionOptions);
    } catch {}
  }

  async function removeSubscription(subscriptionId) {
    try {
      await deleteSubscription(subscriptionId);
    } catch {}
  }

  function setSubscriptions(list) {
    subscriptions.value = list;
  }

  watch(subscriptions, (val) => setTelegramStorageSubscriptions(val), { deep: true });

  // одразу після створення стору — синхронізуємо якщо треба
  syncFromDBIfEmpty();

  return { subscriptions, addSubscription, removeSubscription, setSubscriptions, syncFromDBIfEmpty };
}); 
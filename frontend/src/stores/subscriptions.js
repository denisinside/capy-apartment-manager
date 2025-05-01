import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

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
  const subscriptions = ref(getTelegramStorageSubscriptions());

  function addSubscription(subscription) {
    subscriptions.value.push(subscription);
  }

  function removeSubscription(subscriptionId) {
    subscriptions.value = subscriptions.value.filter(s => s.id !== subscriptionId);
  }

  function setSubscriptions(list) {
    subscriptions.value = list;
  }

  watch(subscriptions, (val) => setTelegramStorageSubscriptions(val), { deep: true });

  return { subscriptions, addSubscription, removeSubscription, setSubscriptions };
}); 
import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useTelegram } from '../useTelegram';
import { fetchSubscriptions, createSubscription, deleteSubscription, updateSubscription } from '../api';

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
  const subscriptions = ref([]);

  async function syncFromDB() {
    if (!userId) return;
    try {
      const res = await fetchSubscriptions(userId);
      if (res.success && Array.isArray(res.data)) {
        subscriptions.value = res.data;
      } else {
        console.warn('Failed to parse subscriptions from API response:', res);
        subscriptions.value = [];
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      subscriptions.value = [];
    }
  }

  async function addSubscription(subscriptionOptions) {
    if (!userId) return;
    try {
      const res = await createSubscription(userId, subscriptionOptions);
      if (res.success && res.data) {
        subscriptions.value.push(res.data);
      } else {
        console.error('Failed to add subscription via API:', res);
      }
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  }

  async function removeSubscription(subscriptionId) {
    if (!userId) return;
    try {
      const res = await deleteSubscription(subscriptionId);
      if (res.success) {
        subscriptions.value = subscriptions.value.filter(sub => sub._id !== subscriptionId);
      } else {
        console.error('Failed to delete subscription via API:', res);
      }
    } catch (error) {
      console.error(`Error removing subscription ${subscriptionId}:`, error);
    }
  }

  async function updateSubscription(subscriptionId, subscriptionOptions) {
    if (!userId) return;
    try {
      const res = await updateSubscription(subscriptionId, userId, subscriptionOptions);
      if (res.success && res.data) {
        const index = subscriptions.value.findIndex(sub => sub._id === subscriptionId);
        if (index !== -1) {
          subscriptions.value[index] = res.data;
        } else {
          subscriptions.value.push(res.data);
        }
      } else {
        console.error(`Failed to update subscription ${subscriptionId} via API:`, res);
      }
    } catch (error) {
      console.error(`Error updating subscription ${subscriptionId}:`, error);
    }
  }

  syncFromDB();

  return { subscriptions, addSubscription, removeSubscription, updateSubscription, syncFromDB };
}); 
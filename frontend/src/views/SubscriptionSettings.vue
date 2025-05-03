<template>
  <div class="settings-page">
    <BackButton />
    <h2 class="page-title">Налаштування підписок</h2>

    <div v-if="isLoading" class="loading-message">Завантаження підписок...</div>
    <div v-else-if="subscriptions.length === 0" class="empty-message">
      У вас ще немає підписок.
      <router-link :to="{ name: 'search' }">Створити першу?</router-link>
    </div>

    <ul v-else class="subscriptions-list">
      <li v-for="sub in subscriptions" :key="sub._id" class="subscription-item">
        <div class="subscription-details">
          <h3 class="subscription-title">{{ getSubscriptionTitle(sub.subscriptionOptions) }}</h3>
          <div class="subscription-tags">
            <span v-for="tag in generateAttributeTags(sub.subscriptionOptions)" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>
        <div class="subscription-actions">
          <button @click="handleEdit(sub)" class="action-button edit-button" title="Редагувати">
            ✏️
          </button>
          <button @click="handleDelete(sub._id)" class="action-button delete-button" title="Видалити">
            🗑️
          </button>
        </div>
      </li>
    </ul>

    <!-- Можна додати кнопку "Створити нову підписку" -->
    <div class="add-new-button-container">
       <button @click="goToSearch" class="add-new-button">+ Створити нову підписку</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSubscriptionsStore } from '../stores/subscriptions';
import { useTelegram } from '../useTelegram';
import BackButton from '../components/BackButton.vue';

const router = useRouter();
const { user, tg } = useTelegram();
const subscriptionsStore = useSubscriptionsStore();

const userId = user?.value?.id || 'test-user'; // TODO: handle real user ID
const isLoading = ref(true);

// Отримуємо підписки зі стору
const subscriptions = computed(() => subscriptionsStore.subscriptions);

// Завантажуємо підписки при монтуванні, якщо їх немає
onMounted(async () => {
  isLoading.value = true;
  try {
    // Викликаємо синхронізацію, якщо стор порожній
    await subscriptionsStore.syncFromDBIfEmpty();
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    // Можна показати повідомлення про помилку
  } finally {
    isLoading.value = false;
  }
});

// Генерує читабельний заголовок підписки
const getSubscriptionTitle = (options) => {
  let title = options.city || 'Підписка';
  if (options.districts && options.districts.length) {
    title += `: ${options.districts.join(', ')}`;
  }
  return title;
};

// Генерує масив тегів з параметрів підписки
const generateAttributeTags = (options) => {
  const tags = [];

  // Кімнати
  if (options.rooms && options.rooms.length) {
    tags.push(`${options.rooms.join('/')}-кімн.`);
  }

  // Ціна
  if (options.price) {
    const { min, max, currency } = options.price;
    const c = currency === 'Usd' ? '$' : currency === 'Eur' ? '€' : 'грн';
    if (min && max) tags.push(`${min}-${max} ${c}`);
    else if (min) tags.push(`від ${min} ${c}`);
    else if (max) tags.push(`до ${max} ${c}`);
  }

  // Площа
  if (options.area) {
    const { min, max } = options.area;
    if (min && max) tags.push(`${min}-${max} м²`);
    else if (min) tags.push(`від ${min} м²`);
    else if (max) tags.push(`до ${max} м²`);
  }

  // Поверх
  if (options.floor) {
    const { min, max } = options.floor;
    if (min && max) tags.push(`${min}-${max} пов.`);
    else if (min) tags.push(`від ${min} пов.`);
    else if (max) tags.push(`до ${max} пов.`);
  }

  // Метро
  if (options.subwayStations && options.subwayStations.length) {
    tags.push(`Метро: ${options.subwayStations.join(', ')}`);
  }

  // ЖК
  if (options.residentialComplexes && options.residentialComplexes.length) {
    tags.push(`ЖК: ${options.residentialComplexes.join(', ')}`);
  }

  // Орієнтири
  if (options.landmarks && options.landmarks.length) {
    tags.push(`Поруч: ${options.landmarks.join(', ')}`);
  }

  // Булеві опції
  if (options.allowPets) tags.push('🐾 З тваринами');
  if (options.allowChildren) tags.push('👨‍👩‍👧‍👦 З дітьми');
  // if (options.bargain) tags.push('Торг'); // Можна додати, якщо потрібно
  if (options.shortPeriod) tags.push('На короткий термін');

  // Комісія (враховуємо різні варіанти)
  if (options.commissionRate === 0 || options.commissionPrice === 0) {
      tags.push('Без комісії');
  } else {
      if (options.commissionRate) tags.push(`Комісія: ${options.commissionRate}%`);
      if (options.commissionPrice) tags.push(`Комісія: ${options.commissionPrice} грн`);
  }

  return tags;
};

// Функція для переходу на сторінку редагування (SearchView)
const handleEdit = (subscription) => {
  const options = subscription.subscriptionOptions;
  const query = {};

  // Конвертуємо параметри підписки у query-параметри для SearchView
  if (options.city) query.city = options.city;
  if (options.price) query.price = JSON.stringify(options.price);
  if (options.area) query.area = JSON.stringify(options.area);
  if (options.floor) query.floor = JSON.stringify(options.floor);
  if (options.rooms && options.rooms.length) query.rooms = JSON.stringify(options.rooms);
  if (options.districts && options.districts.length) query.districts = JSON.stringify(options.districts);
  if (options.subwayStations && options.subwayStations.length) query.subwayStations = JSON.stringify(options.subwayStations);
  if (options.residentialComplexes && options.residentialComplexes.length) query.residentialComplexes = JSON.stringify(options.residentialComplexes);
  if (options.landmarks && options.landmarks.length) query.landmarks = JSON.stringify(options.landmarks);
  if (options.allowPets) query.allowPets = 'true';
  if (options.allowChildren) query.allowChildren = 'true';
  // if (options.bargain) query.bargain = 'true';
  if (options.shortPeriod) query.shortPeriod = 'true'; // Поки SearchView не підтримує
  
  // Обробка комісії: якщо є ставка/ціна, передаємо їх
  // Якщо немає, але ми знаємо, що комісії 0, передаємо noCommission=true
  if (options.commissionRate || options.commissionPrice) {
     query.commission = JSON.stringify({ 
         rate: options.commissionRate, 
         price: options.commissionPrice 
     });
  } else if (options.commissionRate === 0 || options.commissionPrice === 0) {
      query.noCommission = 'true';
  }

  // Додаємо ID підписки, що редагується
  query.editingSubscriptionId = subscription._id;

  router.push({ name: 'search', query });
};

// Функція для видалення підписки
const handleDelete = async (subscriptionId) => {
  if (tg && tg.showConfirm) {
      tg.showConfirm('Ви впевнені, що хочете видалити цю підписку?', async (confirmed) => {
          if (confirmed) {
              try {
                  await subscriptionsStore.removeSubscription(subscriptionId);
                  console.log(`Subscription ${subscriptionId} deleted`);
                  // Опціонально: tg.showAlert('Підписку видалено.')
              } catch (error) {
                  console.error(`Failed to delete subscription ${subscriptionId}:`, error);
                  if (tg && tg.showAlert) {
                      tg.showAlert('Не вдалося видалити підписку. Спробуйте пізніше.');
                  }
              }
          }
      });
  } else {
      // Fallback для середовищ без Telegram WebApp API
      if (confirm('Ви впевнені, що хочете видалити цю підписку?')) {
          try {
              await subscriptionsStore.removeSubscription(subscriptionId);
              console.log(`Subscription ${subscriptionId} deleted`);
          } catch (error) {
              console.error(`Failed to delete subscription ${subscriptionId}:`, error);
              alert('Не вдалося видалити підписку. Спробуйте пізніше.');
          }
      }
  }
};

const goToSearch = () => {
    router.push({ name: 'search' });
}

</script>

<style scoped>
.settings-page {
  padding: 15px;
  padding-top: 60px; /* Відступ для BackButton */
  padding-bottom: 80px; /* Відступ для кнопки Створити */
  position: relative;
  min-height: 100vh;
  background-color: #f8f8f8; /* Трохи світліший фон */
}

.page-title {
  text-align: center;
  font-size: 1.6em;
  margin-bottom: 25px;
  color: #b48c6e;
}

.subscriptions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.subscription-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* Вирівнюємо по верху */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease;
}

.subscription-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.subscription-details {
  flex-grow: 1;
  margin-right: 10px;
}

.subscription-title {
  margin: 0 0 10px 0;
  font-size: 1.2em;
  color: #333;
  font-weight: 600;
}

.subscription-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background-color: #eef; /* Світло-синій фон для тегів */
  color: #448; /* Темно-синій текст */
  border-radius: 15px;
  padding: 4px 10px;
  font-size: 0.85em;
  white-space: nowrap;
}

.subscription-actions {
  display: flex;
  gap: 8px;
  align-items: center; /* Вирівнюємо кнопки по центру */
}

.action-button {
  background: none;
  border: none;
  font-size: 1.4em; /* Збільшуємо розмір іконок */
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.edit-button {
  color: #55a; /* Синій для редагування */
}

.delete-button {
  color: #c55; /* Червоний для видалення */
}

.action-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.loading-message, .empty-message {
  text-align: center;
  margin-top: 40px;
  font-size: 1.1em;
  color: #666;
}

.empty-message a {
    color: #b48c6e;
    text-decoration: underline;
    margin-left: 5px;
}

.add-new-button-container {
    position: fixed;
    bottom: 70px; /* Трохи вище навігації */
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
}

.add-new-button {
    background: linear-gradient(90deg, #eab676 0%, #b48c6e 100%);
    color: #fff;
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    font-size: 1em;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
}

.add-new-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

</style> 
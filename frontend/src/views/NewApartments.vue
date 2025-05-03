<template>
  <div class="new-apartments-page">
    <header class="page-header custom-header">
      <div class="header-text">
        <h2>Нові квартири</h2>
        <p class="subtitle">за твоїми запитами</p>
      </div>
      <button @click="goToSettings" class="settings-button icon-button" title="Налаштування підписок">
        <span role="img" aria-label="settings">⚙️</span>
      </button>
    </header>

    <div v-if="isLoading" class="loading-message">Завантаження...</div>
    <div v-else-if="visibleCardsData.length === 0" class="empty-message">
      Нових квартир за вашими підписками немає.
    </div>

    <div v-else class="tinder-stack">
      <div
        v-for="(cardData, index) in visibleCardsData" 
        :key="cardData.apartment._id" 
        :ref="(el) => setCardRef(el, cardData.apartment._id)" 
        class="tinder-card"
        :style="getCardStyle(cardData.apartment._id, index)" 
        @click="() => handleClick(cardData.apartment._id)"
      >
        <div 
          v-if="cardData.apartment && cardData.apartment.apartment"
          class="apartment-card-content" 
          :style="{ backgroundImage: `url(${getMainImageUrl(cardData.apartment.apartment)})` }"
        >
           <img v-if="cardDynamicStates[cardData.apartment._id]?.isDragging && cardDynamicStates[cardData.apartment._id]?.dragX > dragThreshold" src="/img/like.png" class="swipe-indicator like-indicator">
           <img v-if="cardDynamicStates[cardData.apartment._id]?.isDragging && cardDynamicStates[cardData.apartment._id]?.dragX < -dragThreshold" src="/img/nope.png" class="swipe-indicator nope-indicator">

           <div class="card-info">
            <p class="price">{{ formatPrice(cardData.apartment.apartment.price) }}</p>
            <p>{{ formatAddress(cardData.apartment.apartment.address) }}</p>
            <p>Кімнат: {{ cardData.apartment.apartment.characteristics?.room_count }} | Поверх: {{ cardData.apartment.apartment.characteristics?.floor }}/{{ cardData.apartment.apartment.characteristics?.max_floor }} | Площа: {{ cardData.apartment.apartment.characteristics?.area?.total }} м²</p>
          </div>
        </div>
         <div v-else class="apartment-card-content placeholder-card">
            <p>Помилка завантаження даних картки</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useDraggable } from '@vueuse/core';
import { useTelegram } from '../useTelegram';
import { useFavouritesStore } from '../stores/favourites';
import { getApartmentsForReview, removeNotifiedApartment } from '../api';

const router = useRouter();
const { user, tg } = useTelegram();
const favouritesStore = useFavouritesStore();
const userId = user?.value?.id || 'test-user';

const allApartmentsData = ref([]); // Всі завантажені дані
const visibleCardsData = ref([]); // Дані для карток, що відображаються
const cardRefs = ref({}); // Рефи на DOM елементи
const cardDynamicStates = reactive({}); // Динамічний стан кожної картки (позиція, перетягування і т.д.)

const isLoading = ref(true);
const cardsToShow = 3; 
const dragThreshold = 75; 
const clickThreshold = 5; // Максимальне зміщення для кліку

// --- Ініціалізація стану та Draggable --- 

// Встановлення рефу
const setCardRef = (el, cardId) => {
  if (el) {
    cardRefs.value[cardId] = el;
    // Ініціалізуємо draggable, якщо елемент з'явився і ще не ініціалізовано
    if (cardDynamicStates[cardId] && !cardDynamicStates[cardId].draggableInitialized) {
      initializeDraggableForCard(cardId);
    }
  } else {
    // Якщо елемент видаляється з DOM (при v-for), видаляємо реф
    delete cardRefs.value[cardId];
  }
};

// Ініціалізація useDraggable для картки за її ID
function initializeDraggableForCard(cardId) {
  // Використовуємо watch для очікування появи елемента в refs
  watch(() => cardRefs.value[cardId], (el) => {
    if (el && cardDynamicStates[cardId] && !cardDynamicStates[cardId].draggableInitialized) {
        console.log(`Initializing draggable for card: ${cardId} inside watch`);
        const state = cardDynamicStates[cardId];
        state.draggableInitialized = true; 
        state.dragStartX = 0; // Додаємо для відстеження початкової позиції кліку
        state.dragStartY = 0;

        const { x, y, isDragging: coreIsDragging } = useDraggable(el, {
          initialValue: { x: state.dragX, y: state.dragY },
          preventWindowScrollY: true, // Додаємо для кращої роботи на мобільних
          onStart: (position) => {
              if (!cardDynamicStates[cardId]) return; 
              cardDynamicStates[cardId].transition = 'none'; 
              cardDynamicStates[cardId].isDragging = true;
              cardDynamicStates[cardId].dragStartX = position.x; // Зберігаємо початкову позицію
              cardDynamicStates[cardId].dragStartY = position.y;
          },
          onMove: (position) => {
              if (!cardDynamicStates[cardId]) return;
              cardDynamicStates[cardId].dragX = position.x;
              cardDynamicStates[cardId].dragY = position.y;
              cardDynamicStates[cardId].rotation = position.x / 15; 
          },
          onEnd: (position) => { // Отримуємо кінцеву позицію
              if (!cardDynamicStates[cardId]) return;
              cardDynamicStates[cardId].isDragging = false;
              
              // Перевірка на клік (невелике зміщення)
              const dragDistance = Math.sqrt(Math.pow(position.x - state.dragStartX, 2) + Math.pow(position.y - state.dragStartY, 2));
              
              if (Math.abs(state.dragX) > dragThreshold) {
                  const type = state.dragX > 0 ? 'like' : 'nope';
                  swipeCard(cardId, type);
              } else if (dragDistance < clickThreshold) {
                  // Якщо зміщення мале, вважаємо це кліком (обробник @click спрацює)
                  resetCardPosition(cardId); 
              } else {
                  // Якщо не свайп і не клік, повертаємо на місце
                  resetCardPosition(cardId);
              }
          },
        });
        
         watch(coreIsDragging, (newVal) => {
             if (cardDynamicStates[cardId]) {
                 cardDynamicStates[cardId].isDragging = newVal;
             }
         });
    }
  }, { immediate: true, flush: 'post' }); // flush: 'post' - чекати оновлення DOM
}

// --- Керування Картками --- 

function resetCardPosition(cardId) {
    const state = cardDynamicStates[cardId];
    if (!state) return;
    state.transition = 'transform 0.3s ease-out'; 
    state.dragX = 0;
    state.dragY = 0;
    state.rotation = 0;
}

function swipeCard(cardId, type) {
    const state = cardDynamicStates[cardId];
    if (!state || state.isSwiped) return; // Перевіряємо стан та чи вже свайпнуто

    state.isSwiped = true; // Позначаємо одразу
    const flyOutDuration = 300; 
    const flyOutX = type === 'like' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
    const flyOutY = state.dragY * 1.5; 
    const flyOutRotation = type === 'like' ? 30 : -30; 
    
    console.log(`Swipe ${type}: ${cardId}`);

    state.transition = `transform ${flyOutDuration / 1000}s ease-out`;
    state.dragX = flyOutX;
    state.dragY = flyOutY;
    state.rotation = flyOutRotation;

    removeNotifiedApartment(userId, cardId)
        .catch(error => console.error(`Failed to remove notified apartment ${cardId}:`, error));
    if (type === 'like') {
        favouritesStore.addFavourite(cardId)
            .catch(error => console.error(`Failed to add apartment ${cardId} to favourites:`, error));
    }

    setTimeout(() => {
        const index = visibleCardsData.value.findIndex(c => c.apartment._id === cardId);
        if (index !== -1) {
            visibleCardsData.value.splice(index, 1);
        }
        // Очищаємо стан картки
         delete cardDynamicStates[cardId];
         // Завантажуємо наступну
         loadMoreCards(); 
    }, flyOutDuration);
}

// Завантаження та підготовка нових карток
function loadMoreCards() {
  const currentVisibleCount = visibleCardsData.value.length;
  const needToLoadCount = cardsToShow - currentVisibleCount;

  if (needToLoadCount <= 0) return; 

  const visibleIds = new Set(visibleCardsData.value.map(c => c.apartment._id));
  const availableToLoad = allApartmentsData.value.filter(a => !visibleIds.has(a.apartment._id));

  const cardsToAddData = availableToLoad.slice(0, needToLoadCount); 

  cardsToAddData.forEach(cardData => {
    const cardId = cardData.apartment._id;
    if (!cardDynamicStates[cardId]) {
        cardDynamicStates[cardId] = reactive({ 
            dragX: 0, dragY: 0, rotation: 0,
            transition: 'none', isDragging: false,
            isSwiped: false, draggableInitialized: false,
            dragStartX: 0, dragStartY: 0 
        });
    } else {
        Object.assign(cardDynamicStates[cardId], { 
            dragX: 0, dragY: 0, rotation: 0, 
            transition: 'none', isDragging: false, 
            isSwiped: false, draggableInitialized: false, 
            dragStartX: 0, dragStartY: 0 
        });
    }
    visibleCardsData.value.unshift(cardData);
    initializeDraggableForCard(cardId);
  });
}

// --- Стилі та Допоміжні Функції --- 

const getCardStyle = (cardId, index) => {
    const state = cardDynamicStates[cardId];
    const stackIndex = visibleCardsData.value.findIndex(c => c.apartment._id === cardId);
    const stackPosition = stackIndex >= 0 ? visibleCardsData.value.length - 1 - stackIndex : 0;
    
    const dynamicTransform = state ? `translateX(${state.dragX}px) translateY(${state.dragY}px) rotate(${state.rotation}deg)` : '';
    const stackTransform = `translateY(${stackPosition * 8}px) scale(${1 - stackPosition * 0.03})`;

    return {
        zIndex: visibleCardsData.value.length - stackPosition,
        opacity: stackPosition < cardsToShow ? 1 : 0, 
        transform: `${stackTransform} ${dynamicTransform}`,
        transition: state ? state.transition : 'none',
        cursor: state?.isDragging ? 'grabbing' : 'grab'
    };
};

// Використовуємо apartment.apartment для даних
const getMainImageUrl = (aptDetails) => {
  if (aptDetails && aptDetails.photo && aptDetails.photo.length > 0) { 
    return aptDetails.photo[0]; 
  } 
  return '/img/placeholder.jpg';
};

const formatPrice = (priceData) => {
  if (!priceData) return 'Ціна не вказана';
  // Модель ApartmentDetailsSchema має price як об'єкт { price_number, currency }
  const { price_number, currency } = priceData;
  if (price_number === null || price_number === undefined) return 'Ціна не вказана';
  const displayCurrency = currency === 'Usd' ? '$' : currency === 'Eur' ? '€' : 'грн.';
  return `${price_number.toLocaleString('uk-UA')} ${displayCurrency}`;
};

// Форматування адреси
const formatAddress = (addressData) => {
    if (!addressData) return 'Адреса не вказана';
    const { street, house_number, district, city } = addressData;
    let parts = [];
    if (street) parts.push(street);
    if (house_number) parts.push(house_number);
    if (district && district !== city) parts.push(`${district} р-н`);
    if (city) parts.push(city);
    return parts.join(', ');
};

// --- Навігація --- 
function handleClick(cardId) {
    const state = cardDynamicStates[cardId];
    if (state && !state.isDragging && Math.abs(state.dragX) < clickThreshold && Math.abs(state.dragY) < clickThreshold) {
        goToApartmentDetails(cardId);
    }
}

function goToApartmentDetails(apartmentId) {
    router.push({ name: 'apartment-details', params: { id: apartmentId } });
}

// --- Життєвий Цикл --- 

const fetchAndPrepareApartments = async () => {
  isLoading.value = true;
  visibleCardsData.value = []; 
  Object.keys(cardDynamicStates).forEach(key => delete cardDynamicStates[key]);
  cardRefs.value = {}; 
  try {
    const res = await getApartmentsForReview(userId);
    if (res.success && Array.isArray(res.data)) {
      // Дані приходили як [{ apartment: {...}, subscriptionId: ... }], беремо .apartment
      allApartmentsData.value = res.data.filter(item => item.apartment); // Фільтруємо, якщо раптом квартира не завантажилась
      allApartmentsData.value.reverse(); // Новіші зверху стеку
      loadMoreCards(); 
    } else {
      console.error('Failed to fetch apartments for review:', res.message);
      allApartmentsData.value = [];
    }
  } catch (error) {
    console.error('Error fetching apartments for review:', error);
    allApartmentsData.value = [];
  } finally {
    isLoading.value = false;
  }
};

const goToSettings = () => {
  router.push({ name: 'SubscriptionSettings' });
};

onMounted(() => {
  fetchAndPrepareApartments();
});

</script>

<style scoped>
.new-apartments-page {
  padding: 15px;
  background-color: #f0f0f0; 
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Забороняємо скрол сторінки */
}

.page-header.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center; 
  background-color: #FFF0F5; /* Світло-рожевий фон (приклад) */
  padding: 12px 18px;
  border-radius: 12px; /* Закруглені кути */
  margin-bottom: 20px; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-text {
  /* Контейнер для тексту */
}

.page-header h2 {
  margin: 0;
  font-size: 1.6em; /* Збільшуємо основний заголовок */
  font-weight: 700;
  color: #333; /* Темніший колір для контрасту */
  line-height: 1.2;
}

.subtitle {
  font-size: 0.95em;
  color: #666; /* Сірий колір для підзаголовка */
  margin: 2px 0 0 0;
}

/* Стилі для кнопки-іконки */
.settings-button.icon-button {
  background: none;
  border: none;
  padding: 5px; /* Невеликий відступ навколо іконки */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%; /* Кругла кнопка */
  transition: background-color 0.2s;
}

.settings-button.icon-button span {
  font-size: 1.8em; /* Розмір іконки шестерні */
  color: #555; /* Колір іконки */
  display: block; /* Важливо для коректного відображення */
}

.settings-button.icon-button:hover {
  background-color: rgba(0, 0, 0, 0.05); /* Ефект при наведенні */
}

.tinder-stack {
  position: relative;
  width: 100%;
  flex-grow: 1; /* Стек займає весь доступний простір */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* Важливо, щоб картки не виходили за межі */
  margin-bottom: 15px;
}

.tinder-card {
  position: absolute;
  width: 90vw; /* Ширина відносно viewport */
  max-width: 400px;
  height: 75vh; /* Висота відносно viewport */
  max-height: 600px;
  cursor: grab;
  will-change: transform, opacity; /* Оптимізація анімації */
  touch-action: none; /* Забороняємо стандартну поведінку дотиків */
  user-select: none; /* Забороняємо виділення */
  transform-origin: center bottom; 
}

.tinder-card:active {
  cursor: grabbing;
}

/* Стилізація самої картки (контенту всередині) */
.apartment-card-content {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center center;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden; 
  display: flex;
  flex-direction: column;
  justify-content: flex-end; 
}

/* Градієнт для кращої читабельності тексту */
.apartment-card-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%; 
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0)); 
}

.card-info {
  padding: 20px;
  color: white;
  z-index: 1; 
}

.card-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.4em;
  font-weight: 600;
}

.card-info p {
  margin: 5px 0;
  font-size: 0.95em;
  line-height: 1.4;
}

.card-info .price {
  font-size: 2em;
  font-weight: bold;
  line-height: 1;
}

/* Індикатори Like/Nope */
.swipe-indicator {
    position: absolute;
    top: 30px;
    width: 80px; /* Збільшено */
    height: 80px; /* Збільшено */
    opacity: 0; /* Початково невидимі */
    animation: fadeInIndicator 0.2s forwards;
    z-index: 2;
}

.like-indicator {
    left: 25px;
}

.nope-indicator {
    right: 25px;
}

@keyframes fadeInIndicator {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
}

.loading-message, .empty-message {
  text-align: center;
  margin-top: 50px;
  font-size: 1.2em;
  color: #666;
  flex-grow: 1; /* Щоб займало місце, якщо карток немає */
  display: flex;
  justify-content: center;
  align-items: center;
}

.apartment-card-content.placeholder-card {
    background: #eee;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #999;
    text-align: center;
}
</style> 
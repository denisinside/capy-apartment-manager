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

    <!-- Add apartment count display -->
    <div v-if="!isLoading && allApartmentsData.length > 0" class="remaining-count">
        Залишилось переглянути: {{ remainingApartmentCount }}
    </div>

    <div v-if="isLoading" class="loading-message">Завантаження...</div>
    <div v-else-if="!isLoading && allApartmentsData.length === 0" class="empty-message">
      У вас поки немає підписок або нових квартир за ними.
       <button @click="goToSettings" class="link-button">Перейти до налаштувань</button>
    </div>
    <div v-else-if="!isLoading && visibleCardsData.length === 0 && swipedAllCards" class="empty-message">
        Ви переглянули всі нові квартири!
        <button @click="fetchAndPrepareApartments(true)" class="link-button">Оновити</button>
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
           <div class="drag-overlay" :style="getOverlayStyle(cardData.apartment._id)"></div>

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
const shownCardIds = ref(new Set()); // ID карток, які були показані (включаючи змахнуті)
const cardRefs = ref({}); // Рефи на DOM елементи
const cardDynamicStates = reactive({}); // Динамічний стан кожної картки

const isLoading = ref(true);
const swipedAllCards = computed(() => !isLoading.value && shownCardIds.value.size === allApartmentsData.value.length && allApartmentsData.value.length > 0);

// Add computed property for remaining count
const remainingApartmentCount = computed(() => {
    const total = allApartmentsData.value.length;
    const shown = shownCardIds.value.size;
    return Math.max(0, total - shown); // Ensure count doesn't go negative
});

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
          onStart: (position, event) => { // Added event
              if (!cardDynamicStates[cardId]) return; 
              // Prevent drag initiation on buttons/links inside the card if needed
              // if (event.target.closest('button, a')) return false; 
              cardDynamicStates[cardId].transition = 'none'; 
              cardDynamicStates[cardId].isDragging = true;
              cardDynamicStates[cardId].wasDraggedSignificantly = false; // Reset flag on new drag start
              cardDynamicStates[cardId].dragStartX = state.dragX; // Use current position as start for delta calculation
              cardDynamicStates[cardId].dragStartY = state.dragY;
          },
          onMove: (position) => {
              if (!cardDynamicStates[cardId]) return;
              const currentX = position.x;
              const currentY = position.y;
              cardDynamicStates[cardId].dragX = currentX;
              cardDynamicStates[cardId].dragY = currentY;
              cardDynamicStates[cardId].rotation = currentX / 15; 

              // Check if dragged significantly
              const dragDistance = Math.sqrt(
                  Math.pow(currentX - state.dragStartX, 2) + 
                  Math.pow(currentY - state.dragStartY, 2)
              );
              if (dragDistance > clickThreshold) {
                  cardDynamicStates[cardId].wasDraggedSignificantly = true;
              }
          },
          onEnd: (position) => {
              if (!cardDynamicStates[cardId]) return;
              cardDynamicStates[cardId].isDragging = false;
              
              // Check for swipe first
              if (Math.abs(state.dragX) > dragThreshold) {
                  const type = state.dragX > 0 ? 'like' : 'nope';
                  swipeCard(cardId, type);
              } else {
                  // If not a swipe, reset position regardless of click or drag-return
                  resetCardPosition(cardId);
              }
              // Reset the flag *after* checks, before next potential click
              // Need a slight delay? Or reset it in onStart? Resetting in onStart seems safer.
              // setTimeout(() => { 
              //    if(cardDynamicStates[cardId]) cardDynamicStates[cardId].wasDraggedSignificantly = false; 
              // }, 50); 
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
    // Reset the flag here as well, ensures it's false if card returns to place
    // state.wasDraggedSignificantly = false; // Let's reset only onStart
}

function swipeCard(cardId, type) {
    const state = cardDynamicStates[cardId];
    if (!state || state.isSwiped) return; 

    state.isSwiped = true; 
    const flyOutDuration = 300; 
    const flyOutX = type === 'like' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
    const flyOutY = state.dragY * 1.5; 
    const flyOutRotation = type === 'like' ? 30 : -30; 
    
    console.log(`Swipe ${type}: ${cardId}`);

    state.transition = `transform ${flyOutDuration / 1000}s ease-out`;
    state.dragX = flyOutX;
    state.dragY = flyOutY;
    state.rotation = flyOutRotation;

    // Додаємо в множину показаних
    shownCardIds.value.add(cardId);

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
        // Видаляємо стан, бо картка зникла
         delete cardDynamicStates[cardId];
         delete cardRefs.value[cardId]; // Видаляємо реф теж
         // Завантажуємо наступну
         loadMoreCards();
    }, flyOutDuration);
}

// Завантаження та підготовка нових карток
function loadMoreCards() {
  const currentVisibleCount = visibleCardsData.value.length;
  const needToLoadCount = cardsToShow - currentVisibleCount;

  if (needToLoadCount <= 0) return; 

  // Знаходимо картки, які ще не були показані
  const availableToLoad = allApartmentsData.value.filter(a => !shownCardIds.value.has(a.apartment._id));

  // Беремо необхідну кількість з доступних
  const cardsToAddData = availableToLoad.slice(0, needToLoadCount);

  if (cardsToAddData.length === 0 && currentVisibleCount === 0) {
       console.log("No more cards to load and none visible.");
      // swipedAllCards computed property should handle the empty message
      return;
  }

  cardsToAddData.forEach(cardData => {
    const cardId = cardData.apartment._id;
    // Додаємо ID до множини показаних ОДРАЗУ, щоб не було дублів при швидких діях
    shownCardIds.value.add(cardId);

    if (!cardDynamicStates[cardId]) {
        cardDynamicStates[cardId] = reactive({ 
            dragX: 0, dragY: 0, rotation: 0,
            transition: 'none', isDragging: false,
            isSwiped: false, draggableInitialized: false,
            dragStartX: 0, dragStartY: 0,
            wasDraggedSignificantly: false // Initialize the flag
        });
    } else {
        Object.assign(cardDynamicStates[cardId], { 
            dragX: 0, dragY: 0, rotation: 0, 
            transition: 'none', isDragging: false, 
            isSwiped: false, draggableInitialized: false, 
            dragStartX: 0, dragStartY: 0,
            wasDraggedSignificantly: false // Reset flag if re-initializing state
        });
    }
    // Додаємо в початок масиву видимих (щоб нові були знизу стеку візуально)
    visibleCardsData.value.push(cardData);

    // Ініціалізуємо draggable для нової картки
    // Використовуємо nextTick, щоб гарантувати наявність DOM елемента
    nextTick(() => {
      initializeDraggableForCard(cardId);
    });
  });
}

// --- Стилі та Допоміжні Функції --- 

const getCardStyle = (cardId, index) => {
    const state = cardDynamicStates[cardId];
    // Знаходимо індекс поточної картки у *видимому* масиві
    const stackIndex = visibleCardsData.value.findIndex(c => c.apartment._id === cardId);
    
    // stackPosition: 0 - top card, 1 - next card, 2 - card after next, etc.
    const stackPosition = stackIndex;
    
    let opacity = 0;
    let scale = 1;
    let translateY = 0;
    const baseTranslateY = 8; // Base offset for cards behind
    const scaleDecrement = 0.03; // How much smaller the cards behind are

    if (stackPosition === 0) { // Top card
        opacity = 1;
        scale = 1;
        translateY = 0;
    } else if (stackPosition > 0 && stackPosition < cardsToShow) { // Cards directly behind the top card
        opacity = 1; // Make next cards visible
        scale = 1 - stackPosition * scaleDecrement;
        translateY = stackPosition * baseTranslateY;
    } else { // Cards further down the stack
        opacity = 0; // Hide cards that are too deep
        scale = 1 - cardsToShow * scaleDecrement;
        translateY = cardsToShow * baseTranslateY;
    }

    const dynamicTransform = state ? `translateX(${state.dragX}px) translateY(${state.dragY}px) rotate(${state.rotation}deg)` : '';
    // Apply base stack position + dynamic drag position
    const stackTransform = `translateY(${translateY}px) scale(${scale})`;

    return {
        // zIndex тепер просто зворотній індекс у видимому списку
        zIndex: visibleCardsData.value.length - stackIndex, 
        opacity: opacity,
        // Важливо: застосовуємо і stack, і dynamic transform
        transform: `${stackTransform} ${dynamicTransform}`, 
        transition: state ? state.transition : 'none',
        cursor: state?.isDragging ? 'grabbing' : 'grab'
    };
};

// Стилі для оверлею при перетягуванні
const getOverlayStyle = (cardId) => {
    const state = cardDynamicStates[cardId];
    if (!state || !state.isDragging || Math.abs(state.dragX) < 10) { // Показуємо тільки при значному перетягуванні
        return { opacity: 0, transition: 'opacity 0.2s ease-out' };
    }

    const intensity = Math.min(Math.abs(state.dragX) / (dragThreshold * 1.5), 0.5); // Обмежуємо інтенсивність
    let color = 'transparent';

    if (state.dragX > 10) { // Like direction
        color = `rgba(255, 105, 180, ${intensity})`; // Pinkish
    } else if (state.dragX < -10) { // Nope direction
        color = `rgba(0, 0, 139, ${intensity})`; // Dark bluish
    }

    return {
        opacity: 1,
        backgroundColor: color,
        transition: 'background-color 0.1s ease-out', // Плавна зміна кольору
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
    // Allow navigation only if the card wasn't dragged significantly before the click event
    if (state && !state.wasDraggedSignificantly) { 
        console.log(`Navigating on click: ${cardId}, wasDragged: ${state.wasDraggedSignificantly}`);
        goToApartmentDetails(cardId);
    } else if (state) {
        console.log(`Click ignored due to drag: ${cardId}, wasDragged: ${state.wasDraggedSignificantly}`);
    }
}

function goToApartmentDetails(apartmentId) {
    router.push({ name: 'apartment-details', params: { id: apartmentId } });
}

// --- Життєвий Цикл --- 

const fetchAndPrepareApartments = async (forceRefresh = false) => {
  isLoading.value = true;
  if (forceRefresh) {
      // Скидаємо все перед оновленням
      allApartmentsData.value = [];
      visibleCardsData.value = [];
      shownCardIds.value.clear();
      Object.keys(cardDynamicStates).forEach(key => delete cardDynamicStates[key]);
      cardRefs.value = {};
  }

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
  background-color: var(--color-background); /* Use main bg */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Забороняємо скрол сторінки */
}

.page-header.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center; 
  background-color: var(--color-section-bg); /* Use section bg */
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
  color: var(--color-text); /* Use main text */
  line-height: 1.2;
}

.subtitle {
  font-size: 0.95em;
  color: var(--color-text-secondary); /* Use secondary text */
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
  color: var(--color-text-secondary); /* Use secondary text for icon */
  display: block; /* Важливо для коректного відображення */
}

.settings-button.icon-button:hover {
  background-color: var(--color-background-mute); /* Use muted bg on hover */
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
  overflow: hidden; /* Важливо, щоб оверлей не виходив за межі */
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
  box-shadow: 0 5px 15px color-mix(in srgb, var(--color-background, #000) 80%, transparent); /* Shadow based on bg */
  position: relative;
  overflow: hidden; 
  display: flex;
  flex-direction: column;
  justify-content: flex-end; 
}

/* Оверлей для індикації перетягування */
.drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 15px; /* Повторюємо заокруглення картки */
    z-index: 0; /* Під контентом, але над фоном */
    pointer-events: none; /* Не заважає клікам/перетягуванню самої картки */
}

/* Градієнт для кращої читабельності тексту */
.apartment-card-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%; 
  background: linear-gradient(to top, var(--color-background, rgba(0, 0, 0, 0.85)), transparent); /* Gradient based on bg */
}

.card-info {
  padding: 20px;
  color: var(--color-text); /* Use main text */
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
  color: var(--color-text-secondary); /* Use secondary text */
  flex-grow: 1; /* Щоб займало місце, якщо карток немає */
  display: flex;
  justify-content: center;
  align-items: center;
}

.apartment-card-content.placeholder-card {
    background: var(--color-background-soft); /* Use soft bg */
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--color-text-secondary); /* Use secondary text */
    text-align: center;
}

/* Стиль для кнопок-посилань в повідомленнях */
.link-button {
    background: none;
    border: none;
    color: var(--color-link);
    text-decoration: underline;
    padding: 5px;
    margin-left: 5px;
    cursor: pointer;
    font-size: inherit;
}

.link-button:hover {
    color: var(--color-link-hover);
}

/* Style for the remaining count */
.remaining-count {
    text-align: center;
    font-size: 0.95em;
    color: var(--color-text-secondary);
    margin-top: -10px; /* Adjust position relative to header */
    margin-bottom: 15px;
}
</style> 
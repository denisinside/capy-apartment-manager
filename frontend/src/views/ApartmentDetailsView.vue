<template>
  <div class="details-view" v-if="apartment">
    <BackButton />
    <button class="fav-btn" :class="{ 'liked': liked }" @click.stop="toggleLike" @mousedown.stop @touchstart.stop>
      <span v-if="liked">❤️</span>
      <span v-else>🤍</span>
    </button>
    <div
      class="gallery"
      @click="openPhotoModal(galleryIndex)"
      @touchstart="touchStartGallery"
      @touchmove="touchMoveGallery"
      @touchend="touchEndGallery"
    >
      <img :src="apartment.photo[galleryIndex]" class="gallery-photo" />
      <button
        class="share-btn-gallery"
        @click.stop="shareApartment"
        :disabled="isSharingApartment"
        @mousedown.stop
        @touchstart.stop
        title="Поділитися цим оголошенням"
      >
        <svg v-if="!isSharingApartment" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.22C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.78C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.22L15.15 18.35C15.1 18.58 15.06 18.81 15.06 19.05C15.06 20.71 16.4 22.05 18.06 22.05C19.72 22.05 21.06 20.71 21.06 19.05C21.06 17.39 19.72 16.05 18.06 16.05H18V16.08Z" fill="white"/></svg>
        <span v-else>...</span>
      </button>
      <div v-if="apartment.photo.length > 1" class="gallery-controls">
        <button @click.stop="prevPhoto">‹</button>
        <span>{{ galleryIndex + 1 }}/{{ apartment.photo.length }}</span>
        <button @click.stop="nextPhoto">›</button>
      </div>
    </div>
    <div class="main-info">
      <!-- ... (решта блоку main-info) ... -->
       <div class="top-row">
        <div class="address-block">
          <div class="street">{{ apartment.address.street }}{{ apartment.address.house_number ? ', ' + apartment.address.house_number : '' }}</div>
        </div>
        <div class="price-block">
          <span class="price">{{ apartment.price.price_number }}</span>
        </div>
      </div>
      <div class="sub-row">
        <div class="city-district">
          <span class="city">{{ apartment.address.city }}</span>,
          <span class="district">{{ apartment.address.district }}</span>
        </div>
        <div class="currency-block">
          <span class="currency">{{ currencySymbol }}/міс</span>
        </div>
      </div>
      <div v-if="subwayStation" class="metro-block">
        <span class="metro-icon" :style="{ background: subwayColor }">M</span>
        <span class="metro-name" :style="{ color: subwayColor }">{{ subwayStation }}</span>
      </div>
      <div class="characteristics-block">
        <span>{{ apartment.characteristics.room_count }} кімнати</span>
        <span class="dot">•</span>
        <span>{{ Math.round(apartment.characteristics.area.total) }} м²</span>
        <span class="dot">•</span>
        <span>поверх {{ apartment.characteristics.floor }} з {{ apartment.characteristics.max_floor }}</span>
      </div>
      <div v-if="(apartment.infrastructure.landmarks && apartment.infrastructure.landmarks.length) || apartment.infrastructure.residential_complex" class="landmarks-block">
        <div v-for="(landmark, index) in apartment.infrastructure.landmarks" :key="'lm'+index" class="landmark clickable" @click="goToLandmark(landmark)">
          {{ landmark }}
        </div>
        <div v-if="apartment.infrastructure.residential_complex" class="residential-complex clickable" @click="goToResidential(apartment.infrastructure.residential_complex)">
          ЖК: {{ apartment.infrastructure.residential_complex }}
        </div>
      </div>
      <div class="permits-row">
        <div class="permit-card">
          <span class="permit-icon">🐱</span>
          <span class="permit-text">
            {{ apartment.permits.allow_pets ? 'Можна з тваринами' : 'Без тварин' }}
          </span>
        </div>
        <div class="permit-card">
          <span class="permit-icon">👶</span>
          <span class="permit-text">
            {{ apartment.permits.allow_children ? 'Можна з дітьми' : 'Без дітей' }}
          </span>
        </div>
        <div class="permit-card">
          <span class="permit-icon">💸</span>
          <span class="permit-text">
            <template v-if="commissionText === 'Без комісії'">Без комісії</template>
            <template v-else>{{ commissionText }}</template>
          </span>
        </div>
      </div>
      <div class="description-block">
        <p>{{ apartment.description.advert_description }}</p>
      </div>
      <div v-if="priceHistory.length && priceHistory.length > 1" class="price-history-block">
        <h3 class="price-history-title">Історія зміни ціни</h3>
        <table class="price-history-table">
          <tbody>
            <tr v-for="(change, index) in priceHistory" :key="index">
              <td class="ph-date">
                <span v-if="index === 0 && isYesterday(change.timestamp)">вчора</span>
                <span v-else>{{ formatDate(change.timestamp) }}</span>
              </td>
              <td class="ph-diff">
                <template v-if="index < priceHistory.length - 1">
                  <span :class="priceDiffClass(change, priceHistory[index+1])">
                    {{ priceDiffText(change, priceHistory[index+1]) }}
                  </span>
                </template>
              </td>
              <td class="ph-price">
                <b>{{ change.price_number.toLocaleString() }}</b> <span class="ph-currency">{{ currencySymbol }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
     <div v-if="showPhotoModal" class="photo-modal" @click.self="closePhotoModal"
      @touchstart="touchStartModal"
      @touchmove="touchMoveModal"
      @touchend="touchEndModal"
    >
      <div class="modal-content">
        <button class="close-modal" @click="closePhotoModal">×</button>
        <img :src="apartment.photo[modalPhotoIndex]" class="modal-photo" />
        <div class="modal-photo-counter">{{ modalPhotoIndex + 1 }}/{{ apartment.photo.length }}</div>
        <button v-if="apartment.photo.length > 1" class="modal-prev" @click="prevModalPhoto">‹</button>
        <button v-if="apartment.photo.length > 1" class="modal-next" @click="nextModalPhoto">›</button>
      </div>
    </div>
    <div class="rieltor-block-fixed">
      <div class="rieltor-block-content">
        <div class="rieltor-info-container">
          <img v-if="apartment.rieltor.photo" :src="apartment.rieltor.photo" class="rieltor-photo" @click="goToRieltor"/>
          <div class="rieltor-text-details">
            <div class="rieltor-name" @click="goToRieltor">{{ apartment.rieltor.rieltor_name }}</div>
            <div class="rieltor-subline">
              <div class="rieltor-position">{{ apartment.rieltor.rieltor_position }}</div>
              <div class="rieltor-agency clickable" v-if="apartment.rieltor.rieltor_agency" @click.stop="goToAgency">
                {{ apartment.rieltor.rieltor_agency }}
              </div>
            </div>
          </div>
        </div>
        <button
            class="share-btn-rieltor"
            @click.stop="shareRieltor"
            :disabled="isSharingRieltor || !apartment.rieltor?.rieltor_phone_number"
            title="Поділитися контактом рієлтора"
        >
          <svg v-if="!isSharingRieltor" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.22C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.78C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.22L15.15 18.35C15.1 18.58 15.06 18.81 15.06 19.05C15.06 20.71 16.4 22.05 18.06 22.05C19.72 22.05 21.06 20.71 21.06 19.05C21.06 17.39 19.72 16.05 18.06 16.05H18V16.08Z" fill="currentColor"/></svg>
          <span v-else>...</span>
        </button>
      </div>
      <div class="actions-block">
         <!-- Змінено @click на callRieltor -->
        <button class="call-btn" @click="callRieltor" :disabled="isSendingContact || !apartment.rieltor?.rieltor_phone_number">
          {{ isSendingContact ? 'Надсилаємо...' : 'Набрати' }}
        </button>
        <button class="msg-btn" @click="goToDetails">Детальніше</button>
      </div>
       <div v-if="actionStatusMessage" class="share-status-message" :class="actionStatusType">
           {{ actionStatusMessage }}
       </div>
    </div>
  </div>
  <div v-else class="loading">Завантаження...</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// Додано sendRieltorContactToUser
import { fetchApartmentById, prepareApartmentShare, prepareRieltorShare, sendRieltorContactToUser } from '../api.js'
import { useFavouritesStore } from '../stores/favourites'
import BackButton from '../components/BackButton.vue'
import { useTelegram } from '../useTelegram'

const route = useRoute()
const router = useRouter()
const apartment = ref(null)
const store = useFavouritesStore()
const liked = ref(false)
const galleryIndex = ref(0)
const showPhotoModal = ref(false)
const modalPhotoIndex = ref(0)
const priceHistory = ref([])
const { tg, user, isReady } = useTelegram()
const isSharingApartment = ref(false)
const isSharingRieltor = ref(false) // Для кнопки "Поділитися"
const isSendingContact = ref(false) // Новий стан для кнопки "Набрати"
const actionStatusMessage = ref(''); // Спільне повідомлення про статус
const actionStatusType = ref(''); // 'success', 'error', 'info'

const galleryTouchStartX = ref(0)
const galleryTouchEndX = ref(0)

const modalTouchStartX = ref(0)
const modalTouchEndX = ref(0)

// Функція для показу повідомлень користувачу
function showActionStatus(message, type = 'info', duration = 3000) {
    actionStatusMessage.value = message;
    actionStatusType.value = type;
    if (duration > 0) { // Дозволити duration = 0 для постійного повідомлення
        setTimeout(() => {
            actionStatusMessage.value = '';
            actionStatusType.value = '';
        }, duration);
    }
}

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await fetchApartmentById(id)
    if (res.success) {
      const data = res.data
      apartment.value = data.apartment || data
      priceHistory.value = data.price_history || []
      if (apartment.value?._id) {
        liked.value = store.favourites.includes(apartment.value._id)
      } else {
        console.warn("Apartment ID is missing, cannot check favourites status.");
        liked.value = false;
      }
    } else {
       console.error("API call to fetch apartment was not successful:", res);
       showActionStatus('Помилка: Не вдалося отримати дані квартири', 'error');
    }
  } catch (e) {
    console.error("Failed to load apartment data:", e);
    showActionStatus('Помилка завантаження даних квартири', 'error');
  }
})

const currencySymbol = computed(() => {
  const currency = apartment.value?.price?.currency || ''
  if (currency.toLowerCase() === 'usd') return '$'
  if (currency.toLowerCase() === 'eur') return '€'
  if (currency.toLowerCase() === 'uah') return 'грн'
  return currency
})

const subwayStation = computed(() => {
  const stations = apartment.value?.infrastructure?.subway_station
  if (stations && stations.length > 0) return stations[0].name
  return null
})

const subwayColor = computed(() => {
  const stations = apartment.value?.infrastructure?.subway_station
  if (stations && stations.length > 0) {
    if (stations[0].line === 'Red') return '#e74c3c'
    if (stations[0].line === 'Green') return '#27ae60'
    if (stations[0].line === 'Blue') return '#2980b9'
  }
  return '#757575'
})

const commissionText = computed(() => {
  const commission = apartment.value?.permits?.commission
  if (!commission) return 'Без комісії'
  const rate = commission.commission_rate
  const price = commission.commission_price?.price_number
  if ((rate === 0 || rate === '0') && (!price || price === 0)) return 'Без комісії'
  if (rate && rate > 0) return `Комісія ${rate}%`
  if (price && price > 0) return `Комісія ${price} грн`
  return 'Без комісії'
})

function nextPhoto() {
  if (!apartment.value?.photo || apartment.value.photo.length === 0) return;
  if (galleryIndex.value < apartment.value.photo.length - 1) {
    galleryIndex.value++;
  } else {
    galleryIndex.value = 0;
  }
}
function prevPhoto() {
 if (!apartment.value?.photo || apartment.value.photo.length === 0) return;
  if (galleryIndex.value > 0) {
    galleryIndex.value--;
  } else {
    galleryIndex.value = apartment.value.photo.length - 1;
  }
}
function openPhotoModal(idx) {
  modalPhotoIndex.value = idx
  showPhotoModal.value = true
}
function closePhotoModal() {
  showPhotoModal.value = false
}
function nextModalPhoto() {
 if (!apartment.value?.photo || apartment.value.photo.length === 0) return;
  if (modalPhotoIndex.value < apartment.value.photo.length - 1) {
    modalPhotoIndex.value++;
  } else {
    modalPhotoIndex.value = 0;
  }
}
function prevModalPhoto() {
 if (!apartment.value?.photo || apartment.value.photo.length === 0) return;
  if (modalPhotoIndex.value > 0) {
    modalPhotoIndex.value--;
  } else {
    modalPhotoIndex.value = apartment.value.photo.length - 1;
  }
}
function touchStartGallery(e) {
  galleryTouchStartX.value = e.changedTouches[0].screenX
}
function touchMoveGallery(e) {
  galleryTouchEndX.value = e.changedTouches[0].screenX
}
function touchEndGallery() {
  if (apartment.value?.photo?.length <= 1) return
  const diff = galleryTouchStartX.value - galleryTouchEndX.value
  if (galleryTouchStartX.value !== 0 && galleryTouchEndX.value !== 0) {
      if (diff > 50) {
        nextPhoto()
      } else if (diff < -50) {
        prevPhoto()
      }
  }
  galleryTouchStartX.value = 0;
  galleryTouchEndX.value = 0;
}
function touchStartModal(e) {
  modalTouchStartX.value = e.changedTouches[0].screenX
}
function touchMoveModal(e) {
  modalTouchEndX.value = e.changedTouches[0].screenX
}
function touchEndModal() {
  if (apartment.value?.photo?.length <= 1) return
  const diff = modalTouchStartX.value - modalTouchEndX.value
  if (modalTouchStartX.value !== 0 && modalTouchEndX.value !== 0) {
      if (diff > 50) {
        nextModalPhoto()
      } else if (diff < -50) {
        prevModalPhoto()
      }
  }
  modalTouchStartX.value = 0;
  modalTouchEndX.value = 0;
}

function toggleLike() {
  if (!apartment.value?._id) {
     console.warn("Cannot toggle like, apartment ID is missing.");
     return;
  }
  liked.value = !liked.value
  const id = apartment.value._id
  if (liked.value) {
    store.addFavourite(id)
  } else {
    store.removeFavourite(id)
  }
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts)
  return d.toLocaleDateString('uk-UA')
}
function isYesterday(ts) {
  if (!ts) return false;
  const d = new Date(ts)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  return d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()
}
function priceDiff(change, prev) {
  if (!change?.price_number || !prev?.price_number) return 0;
  return change.price_number - prev.price_number
}
function priceDiffText(change, prev) {
  const diff = priceDiff(change, prev)
  if (diff === 0) return ''
  const sign = diff > 0 ? '+' : '-'
  const cs = currencySymbol.value || '';
  return `${sign} ${Math.abs(diff).toLocaleString()} ${cs} ${diff > 0 ? '▲' : '▼'}`
}
function priceDiffClass(change, prev) {
  const diff = priceDiff(change, prev)
  if (diff > 0) return 'ph-up'
  if (diff < 0) return 'ph-down'
  return ''
}

// --- Функція для кнопки "Поділитися" (використовує prepareRieltorShare + tg.shareMessage) ---
async function shareRieltor() {
  const rieltor = apartment.value?.rieltor;
  if (!tg || !isReady.value || !user.value?.id || !rieltor?.rieltor_name || !rieltor?.rieltor_phone_number) {
    console.error('Share Rieltor: Prereqs not met', { tg, isReady: isReady.value, user: user.value, rieltor });
    showActionStatus('Помилка: Не вдалося підготувати контакт рієлтора для поширення.', 'error');
    return;
  }
  if (isSharingRieltor.value) return; // Перевірка стану
  isSharingRieltor.value = true;
  showActionStatus('Готуємо контакт для поширення...', 'info', 0); // 0 = не зникає самостійно

  try {
    const payload = {
      userId: user.value.id,
      rieltorName: rieltor.rieltor_name,
      rieltorPhoneNumber: rieltor.rieltor_phone_number,
      rieltorPhotoUrl: rieltor.photo,
      apartmentId: apartment.value._id
    };
    const response = await prepareRieltorShare(payload);

    if (response.success && response.preparedMessageId) {
      if (tg.shareMessage) {
        showActionStatus('Відкриваємо вікно Telegram для поширення...', 'info', 0);
        tg.shareMessage(response.preparedMessageId, (sent) => {
          if (sent) {
            showActionStatus('Контакт рієлтора поширено!', 'success');
          } else {
            showActionStatus('Поширення контакту скасовано.', 'info');
          }
          isSharingRieltor.value = false; // Скидаємо стан тут
        });
      } else {
        showActionStatus('Функція "Поділитися" не доступна.', 'error');
        isSharingRieltor.value = false; // Скидаємо стан
      }
    } else {
      showActionStatus(`Помилка підготовки контакту: ${response?.message || 'Невідома помилка'}`, 'error');
      isSharingRieltor.value = false; // Скидаємо стан
    }
  } catch (error) {
    console.error('Error preparing/sharing rieltor contact:', error);
    showActionStatus(`Помилка поширення: ${error.message}`, 'error');
    isSharingRieltor.value = false; // Скидаємо стан
  }
}

// --- Функція для кнопки "Набрати" (використовує sendRieltorContactToUser) ---
async function callRieltor() {
    const rieltor = apartment.value?.rieltor;
    if (!isReady.value || !user.value?.id || !rieltor?.rieltor_name || !rieltor?.rieltor_phone_number) {
        console.error('Call Rieltor (Send Contact): Prereqs not met', { isReady: isReady.value, user: user.value, rieltor });
        showActionStatus('Помилка: Не вдалося надіслати контакт рієлтора.', 'error');
        return;
    }
    if (isSendingContact.value) return; // Перевірка стану
    isSendingContact.value = true;
    showActionStatus('Надсилаємо контакт у чат...', 'info', 0);

    try {
        const payload = {
          userId: user.value.id,
          rieltorName: rieltor.rieltor_name,
          rieltorPhoneNumber: rieltor.rieltor_phone_number,
          rieltorPhotoUrl: rieltor.photo,
          apartmentId: apartment.value._id
        };
        const response = await sendRieltorContactToUser(payload);

        if (response.success) {
            showActionStatus('Контакт рієлтора надіслано вам у чат!', 'success');
            // Можна додати tg.close() якщо треба закривати додаток після надсилання
            // if (tg) tg.close();
        } else {
            // Помилка оброблена в api.js, але можна додати специфічне повідомлення тут
             showActionStatus(`Помилка надсилання контакту: ${response?.message || 'Невідома помилка'}`, 'error');
        }
    } catch (error) {
        console.error('Error sending rieltor contact to user:', error);
        showActionStatus(`Помилка надсилання: ${error.message}`, 'error');
    } finally {
        isSendingContact.value = false; // Завжди скидаємо стан
    }
}


// --- Існуюча функція для поширення оголошення ---
async function shareApartment() {
  if (!tg || !isReady.value || !user.value?.id || !apartment.value?._id) {
    console.error('Share Apartment: Prereqs not met.');
    showActionStatus('Помилка: Неможливо поділитися оголошенням зараз.', 'error');
    return;
  }
  if (isSharingApartment.value) return;
  isSharingApartment.value = true;
  showActionStatus('Готуємо оголошення для надсилання...', 'info', 0);

  try {
    const response = await prepareApartmentShare({
      userId: user.value.id,
      apartmentId: apartment.value._id
    });

    if (response.success && response.preparedMessageId) {
      if (tg.shareMessage) {
        showActionStatus('Відкриваємо вікно Telegram для надсилання...', 'info', 0);
        tg.shareMessage(response.preparedMessageId, (sent) => {
          if (sent) {
            showActionStatus('Оголошення успішно надіслано!', 'success');
          } else {
             showActionStatus('Надсилання оголошення скасовано.', 'info');
          }
           isSharingApartment.value = false; // Скидання стану
        });
      } else {
        showActionStatus('Функція "Поділитися" не доступна.', 'error');
        isSharingApartment.value = false; // Скидання стану
      }
    } else {
      showActionStatus(`Помилка підготовки оголошення: ${response?.message || 'Невідома помилка'}`, 'error');
      isSharingApartment.value = false; // Скидання стану
    }
  } catch (error) {
    console.error('Error sharing apartment via bot:', error);
    showActionStatus(`Помилка: ${error.message}`, 'error');
    isSharingApartment.value = false; // Скидання стану
  }
}

function goToDetails() {
  const link = apartment.value?.link
  if (link) {
      if (tg?.openLink) {
         tg.openLink(link);
      } else {
          window.open(link, '_blank');
          console.warn('WebApp.openLink is not available. Falling back to window.open');
      }
  } else {
      console.warn('No link found for apartment details.');
       showActionStatus('Посилання на оригінальне оголошення відсутнє.', 'info');
  }
}
function goToLandmark(landmark) {
  if (apartment.value?.address?.city && landmark) {
      router.push({ name: 'results', query: { city: apartment.value.address.city, landmarks: JSON.stringify([landmark]) } })
  }
}
function goToResidential(residential) {
 if (apartment.value?.address?.city && residential) {
     router.push({ name: 'results', query: { city: apartment.value.address.city, residentialComplexes: JSON.stringify([residential]) } })
 }
}
function goToRieltor() {
    if (apartment.value?.rieltor?.rieltor_name) {
       router.push({ name: 'rieltor', params: { name: apartment.value.rieltor.rieltor_name } })
    }
}
function goToAgency() {
    if (apartment.value?.rieltor?.rieltor_agency) {
        router.push({ name: 'agency', params: { name: apartment.value.rieltor.rieltor_agency } })
    }
}
</script>

<style scoped>
/* ... (стилі залишаються ті ж самі, що й у попередньому кроці) ... */
.details-view {
  position: relative;
  max-width: 500px;
  margin: 0 auto;
  background: var(--color-background);
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 0 0 10px 0;
  /* Відступ знизу для фіксованого блоку */
  margin-bottom: 170px; /* Підібрати значення */
}
.gallery {
  width: 100%;
  position: relative;
  background: var(--color-background-mute);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.gallery-photo {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  display: block;
  border-bottom: 5px solid var(--color-accent);
}
.gallery-controls {
  position: absolute;
  bottom: 12px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  color: var(--color-text);
  font-size: 18px;
  z-index: 2;
  padding-left: 16px;
  padding-right: 50px;
}
.gallery-controls button {
  background: color-mix(in srgb, var(--color-background) 50%, transparent);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 22px;
  cursor: pointer;
}
.main-info {
  padding: 18px 18px 0 18px;
}
.top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0;
}
.address-block {
  flex: 1 1 0;
  min-width: 0;
}
.price-block {
  width: 110px;
  min-width: 90px;
  text-align: right;
  flex-shrink: 0;
}
.price {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.1;
}
.sub-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0;
}
.city-district {
  font-size: 18px;
  color: var(--color-accent);
  line-height: 1.1;
}
.city-district span {
  font-weight: 500;
}
.currency-block {
  width: 110px;
  min-width: 90px;
  font-size: 16px;
  color: var(--color-text-secondary);
  text-align: right;
  flex-shrink: 0;
  line-height: 1.1;
}
.street {
  font-size: clamp(16px, 5vw, 28px);
  font-weight: 600;
  color: var(--color-text);
  text-align: left;
  line-height: 1.1;
  letter-spacing: -0.5px;
  width: auto;
  word-break: break-word;
  display: block;
}
.metro-block {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--color-text);
}
.metro-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.metro-name {
  font-weight: 600;
  font-size: 14px;
}
.characteristics-block {
  display: flex;
  gap: 8px;
  font-size: 15px;
  color: var(--color-text);
  margin-bottom: 10px;
  align-items: center;
  flex-wrap: wrap; /* Дозволити перенос */
}
.characteristics-block .dot {
  font-size: 10px;
  color: var(--color-hint-color);
  margin: 0 4px;
  user-select: none;
}
.permits-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  margin-top: 2px;
  flex-wrap: wrap; /* Дозволити перенос */
}
.permit-card {
  background: var(--color-background-soft);
  border-radius: 10px;
  padding: 8px 12px 6px 10px;
  display: flex;
  align-items: center;
  min-width: 90px;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.permit-icon {
  font-size: 22px;
  margin-right: 7px;
  display: flex;
  align-items: center;
}
.permit-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  white-space: pre-line;
  line-height: 1.1;
}
.description-block {
  font-size: 15px;
  color: var(--color-text);
  margin-bottom: 8px;
}
.rieltor-block-fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 56px; /* Піднято трохи вище */
  background: var(--color-bottom-bar-bg);
  z-index: 100;
  box-shadow: 0 -2px 12px color-mix(in srgb, var(--color-border) 20%, transparent);
  padding: 10px 18px 10px 18px;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 500px; /* Обмеження ширини */
  margin: 0 auto; /* Центрування */
}
.rieltor-block-content {
  display: flex;
  align-items: center; /* Вирівнювання по центру вертикалі */
  justify-content: space-between;
  gap: 12px;
}
.rieltor-info-container {
  display: flex;
  align-items: center; /* Вирівняти фото та текст по центру */
  gap: 10px;
  flex-grow: 1; /* Дозволити контейнеру рости */
  min-width: 0; /* Для правильного переносу тексту всередині */
}
.rieltor-photo {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0; /* Не стискати фото */
  cursor: pointer;
}
.rieltor-text-details {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0; /* Дозволити внутрішньому контенту стискатись */
}
.rieltor-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--color-text);
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap; /* Запобігти переносу імені */
  overflow: hidden;
  text-overflow: ellipsis; /* Додати три крапки, якщо не влазить */
}
.rieltor-subline { /* Новий блок для позиції та агенції */
  display: flex;
  justify-content: space-between; /* Рознести елементи */
  align-items: baseline; /* Вирівняти по базовій лінії */
  gap: 8px; /* Проміжок між ними */
  width: 100%;
}
.rieltor-position {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap; /* Запобігти переносу */
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1; /* Дозволити стискатись при потребі */
}
.rieltor-agency {
  font-size: 13px; /* Зробимо однаковий розмір з позицією */
  color: var(--color-link);
  font-weight: 500; /* Трохи менш жирний */
  cursor: pointer;
  text-align: right; /* Вирівняти текст агенції по правому краю */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0; /* Не стискати агенцію (або 1 якщо треба) */
}

.clickable {
  cursor: pointer;
  text-decoration: underline;
}
.actions-block {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}
.call-btn, .msg-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  min-width: 100px; /* Мінімальна ширина кнопок */
}
.call-btn {
  background: var(--color-button);
  color: var(--color-button-text);
}
.call-btn:disabled {
    background: var(--color-button-disabled-bg);
    color: var(--color-button-disabled-text);
    cursor: not-allowed;
}
.msg-btn {
  background: var(--color-background-soft);
  color: var(--color-link);
  border: 1px solid var(--color-link);
}
.loading {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 18px;
}

.photo-modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  position: relative;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
}
.modal-photo {
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
  display: block;
  margin: auto;
  object-fit: contain;
}
.close-modal {
  position: absolute;
  top: 24px;
  right: 32px;
  background: none;
  border: none;
  color: #fff;
  font-size: 40px;
  cursor: pointer;
  z-index: 2;
  padding: 0 10px;
  line-height: 1;
}
.modal-photo-counter {
  color: #fff;
  background: rgba(0,0,0,0.5);
  border-radius: 8px;
  padding: 2px 10px;
  font-size: 15px;
  margin-top: 10px;
  font-weight: 500;
}
.modal-prev, .modal-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.7);
  color: #fff;
  border: none;
  font-size: 40px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  opacity: 0.9;
}
.modal-prev:hover, .modal-next:hover {
  background: rgba(0,0,0,1);
}
.modal-prev {
  left: 16px;
}
.modal-next {
  right: 16px;
}
.fav-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  z-index: 20;
  padding: 4px;
  color: var(--color-hint-color);
}
.fav-btn.liked span {
  color: var(--color-destructive);
}
.landmarks-block {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.landmark, .residential-complex {
  background: var(--color-background-soft);
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 14px;
  color: var(--color-link);
}
.price-history-block {
  margin: 24px 0 0 0;
  color: var(--color-text);
  background: var(--color-background-soft);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 0 0 0 0;
}
.price-history-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  padding: 12px 12px 0 12px;
}
.price-history-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 1.1rem;
}
.price-history-table tr {
  border-bottom: 1px solid var(--color-border);
}
.price-history-table tr:last-child {
  border-bottom: none;
}
.ph-date {
  color: var(--color-text-secondary);
  padding: 8px 12px;
  min-width: 110px;
  font-size: 1rem;
}
.ph-diff {
  min-width: 120px;
  font-weight: 600;
  font-size: 1.1rem;
  text-align: left;
}
.ph-up {
  color: var(--color-destructive);
}
.ph-down {
  color: #27ae60;
}
.ph-price {
  font-weight: 700;
  font-size: 1.2rem;
  text-align: right;
  min-width: 120px;
  padding: 8px 12px;
}
.ph-currency {
  font-weight: 500;
  font-size: 1rem;
  color: var(--color-text);
}

.share-btn-gallery {
  position: absolute;
  bottom: 12px;
  right: 16px;
  background-color: color-mix(in srgb, var(--color-background) 60%, transparent);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 15;
  transition: background-color 0.2s;
  padding: 0;
}
.share-btn-gallery:hover {
  background-color: color-mix(in srgb, var(--color-background) 80%, transparent);
}
.share-btn-gallery svg path {
  fill: var(--color-text);
}
.share-btn-gallery:disabled {
    background-color: color-mix(in srgb, var(--color-text-secondary) 30%, transparent);
    cursor: not-allowed;
}
.share-btn-gallery:disabled svg path {
    fill: var(--color-text-secondary);
}
.share-btn-gallery:disabled span {
    color: var(--color-text-secondary);
}

/* Кнопка Поділитися контактом рієлтора */
.share-btn-rieltor {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: var(--color-link);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* Не стискати кнопку */
}
.share-btn-rieltor:disabled {
  color: var(--color-hint-color);
  cursor: not-allowed;
}
.share-btn-rieltor svg {
  width: 22px;
  height: 22px;
}

/* Повідомлення про статус дії */
.share-status-message { /* Перейменовано для загальності */
    font-size: 14px;
    text-align: center;
    padding: 6px 10px;
    margin: 4px 0 4px 0;
    border-radius: 6px;
    font-weight: 500;
}
.share-status-message.info {
    color: var(--color-text-secondary);
    background-color: var(--color-background-soft);
}
.share-status-message.success {
    color: #27ae60;
    background-color: color-mix(in srgb, #27ae60 15%, transparent);
}
.share-status-message.error {
    color: var(--color-destructive);
    background-color: color-mix(in srgb, var(--color-destructive) 15%, transparent);
}
</style>

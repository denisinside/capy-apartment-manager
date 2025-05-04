<template>
  <div class="rieltor-view">
    <BackButton />
    <div class="rieltor-block-fixed">
      <div class="rieltor-header">
        <div class="rieltor-info-centered">
          <img v-if="rieltorInfo?.photo" :src="rieltorInfo.photo" class="rieltor-photo" />
          <div class="rieltor-name">{{ rieltorInfo?.rieltor_name || rieltorName }}</div>
          <div class="rieltor-position">{{ rieltorInfo?.rieltor_position }}</div>
          <div class="rieltor-agency clickable" v-if="rieltorInfo?.rieltor_agency" @click="goToAgencyPage">
            {{ rieltorInfo.rieltor_agency }}
          </div>
        </div>
         <button
            class="share-btn-rieltor-header"
            @click.stop="shareRieltor"
            :disabled="isSharingRieltor || !rieltorInfo?.rieltor_phone_number"
            title="Поділитися контактом рієлтора"
         >
            <svg v-if="!isSharingRieltor" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.22C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.78C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.22L15.15 18.35C15.1 18.58 15.06 18.81 15.06 19.05C15.06 20.71 16.4 22.05 18.06 22.05C19.72 22.05 21.06 20.71 21.06 19.05C21.06 17.39 19.72 16.05 18.06 16.05H18V16.08Z" fill="currentColor"/></svg>
            <span v-else>...</span>
         </button>
      </div>
      <div class="actions-block">
         <!-- Змінено @click на callRieltor -->
        <button class="call-btn" @click="callRieltor" :disabled="isSendingContact || !rieltorInfo?.rieltor_phone_number">
            {{ isSendingContact ? 'Надсилаємо...' : 'Набрати' }}
        </button>
        <button class="msg-btn" @click="goToAgencyPage" :disabled="!rieltorInfo?.rieltor_agency">Агенція</button>
      </div>
       <div v-if="actionStatusMessage" class="share-status-message" :class="actionStatusType">
           {{ actionStatusMessage }}
       </div>
      <div class="apartment-count">Знайдено {{ apartments.length }} квартир</div>
    </div>
    <ApartmentList :apartments="apartments" :loading="loading" empty-text="Нічого не знайдено" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// Додано sendRieltorContactToUser
import { fetchApartmentsByRieltor, prepareRieltorShare, sendRieltorContactToUser } from '../api.js'
import ApartmentList from '../components/ApartmentList.vue'
import BackButton from '../components/BackButton.vue'
import { useTelegram } from '../useTelegram'

const route = useRoute()
const router = useRouter()
const { tg, user, isReady } = useTelegram()
const rieltorName = route.params.name
const apartments = ref([])
const loading = ref(false)
const rieltorInfo = ref(null)
const showPhoneNumber = ref(false) // Більше не використовується для показу номера перед дією
const isSharingRieltor = ref(false) // Для кнопки "Поділитися"
const isSendingContact = ref(false) // Для кнопки "Набрати"
const actionStatusMessage = ref(''); // Спільне повідомлення
const actionStatusType = ref('');

// Функція для показу повідомлень користувачу
function showActionStatus(message, type = 'info', duration = 3000) {
    actionStatusMessage.value = message;
    actionStatusType.value = type;
    if (duration > 0) {
        setTimeout(() => {
            actionStatusMessage.value = '';
            actionStatusType.value = '';
        }, duration);
    }
}

// --- Функція для кнопки "Поділитися" (використовує prepareRieltorShare + tg.shareMessage) ---
async function shareRieltor() {
  if (!tg || !isReady.value || !user.value?.id || !rieltorInfo.value?.rieltor_name || !rieltorInfo.value?.rieltor_phone_number) {
    console.error('Share Rieltor: Prereqs not met');
    showActionStatus('Помилка: Не вдалося підготувати контакт рієлтора для поширення.', 'error');
    return;
  }
  if (isSharingRieltor.value) return;
  isSharingRieltor.value = true;
  showActionStatus('Готуємо контакт для поширення...', 'info', 0);

  try {
    const payload = {
      userId: user.value.id,
      rieltorName: rieltorInfo.value.rieltor_name,
      rieltorPhoneNumber: rieltorInfo.value.rieltor_phone_number,
      rieltorPhotoUrl: rieltorInfo.value.photo,
      // apartmentId не передаємо
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
          isSharingRieltor.value = false;
        });
      } else {
        showActionStatus('Функція "Поділитися" не доступна.', 'error');
        isSharingRieltor.value = false;
      }
    } else {
      showActionStatus(`Помилка підготовки контакту: ${response?.message || 'Невідома помилка'}`, 'error');
      isSharingRieltor.value = false;
    }
  } catch (error) {
    console.error('Error preparing/sharing rieltor contact:', error);
    showActionStatus(`Помилка поширення: ${error.message}`, 'error');
    isSharingRieltor.value = false;
  }
}

// --- Функція для кнопки "Набрати" (використовує sendRieltorContactToUser) ---
async function callRieltor() {
    if (!isReady.value || !user.value?.id || !rieltorInfo.value?.rieltor_name || !rieltorInfo.value?.rieltor_phone_number) {
        console.error('Call Rieltor (Send Contact): Prereqs not met');
        showActionStatus('Помилка: Не вдалося надіслати контакт рієлтора.', 'error');
        return;
    }
    if (isSendingContact.value) return;
    isSendingContact.value = true;
    showActionStatus('Надсилаємо контакт у чат...', 'info', 0);

    try {
        const payload = {
          userId: user.value.id,
          rieltorName: rieltorInfo.value.rieltor_name,
          rieltorPhoneNumber: rieltorInfo.value.rieltor_phone_number,
          rieltorPhotoUrl: rieltorInfo.value.photo,
          // apartmentId не передаємо
        };
        const response = await sendRieltorContactToUser(payload);

        if (response.success) {
            showActionStatus('Контакт рієлтора надіслано вам у чат!', 'success');
        } else {
             showActionStatus(`Помилка надсилання контакту: ${response?.message || 'Невідома помилка'}`, 'error');
        }
    } catch (error) {
        console.error('Error sending rieltor contact to user:', error);
        showActionStatus(`Помилка надсилання: ${error.message}`, 'error');
    } finally {
        isSendingContact.value = false;
    }
}


function goToAgencyPage() {
  if (rieltorInfo.value?.rieltor_agency) {
    router.push({ name: 'agency', params: { name: rieltorInfo.value.rieltor_agency } })
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetchApartmentsByRieltor(rieltorName)
    if (res.success && Array.isArray(res.data)) {
      apartments.value = res.data
      if (res.data.length > 0 && res.data[0]?.apartment?.rieltor) {
        // Отримуємо повну інформацію про рієлтора з першої знайденої квартири
        rieltorInfo.value = res.data[0].apartment.rieltor;
        // Переконуємось, що ім'я рієлтора відповідає тому, що в URL, якщо воно є в даних
        if (rieltorInfo.value.rieltor_name !== rieltorName && rieltorInfo.value.rieltor_name) {
             console.warn(`Rieltor name mismatch: URL param "${rieltorName}", data says "${rieltorInfo.value.rieltor_name}". Using name from data.`);
        } else if (!rieltorInfo.value.rieltor_name) {
            // Якщо ім'я відсутнє в даних, використовуємо з URL
             rieltorInfo.value.rieltor_name = rieltorName;
             console.warn("Rieltor name missing in fetched data, using URL param.");
        }
      } else {
          // Якщо квартир немає, створюємо базовий об'єкт з ім'ям з URL
          // Інформація (фото, телефон, агенція) буде відсутня
          rieltorInfo.value = { rieltor_name: rieltorName };
          console.warn("No apartments found for this rieltor, info will be limited.");
          showActionStatus('Квартири цього рієлтора не знайдено. Інформація може бути неповною.', 'info', 5000);
      }
    } else {
      apartments.value = [];
      rieltorInfo.value = { rieltor_name: rieltorName }; // Базовий об'єкт
      console.error("Failed to fetch apartments or unexpected response format:", res);
      showActionStatus('Не вдалося завантажити дані. Спробуйте пізніше.', 'error');
    }
  } catch (error) {
     console.error("Failed to load rieltor data:", error);
     apartments.value = [];
     rieltorInfo.value = { rieltor_name: rieltorName }; // Базовий об'єкт
     showActionStatus('Помилка завантаження даних рієлтора.', 'error');
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ... (стилі залишаються ті ж самі, що й у попередньому кроці) ... */
.rieltor-view {
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 80px;
  position: relative;
}
.rieltor-block-fixed {
  background: var(--color-section-bg);
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  margin: 0 0 18px 0;
  padding: 18px 18px 10px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  text-align: center;
}
.rieltor-header { /* Новий контейнер для інфо та кнопки share */
    display: flex;
    justify-content: space-between; /* Рознести інфо та кнопку */
    align-items: flex-start; /* Вирівняти по верху */
    gap: 10px;
    margin-bottom: 12px;
}
.rieltor-info-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  /* margin-bottom: 12px; */ /* Перенесено до батьківського */
  flex-grow: 1; /* Дозволити блоку інфо рости */
  text-align: center;
}
.rieltor-photo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 6px;
}
.rieltor-name {
  font-weight: 600;
  font-size: 18px;
  color: var(--color-text);
  line-height: 1.2;
}
.rieltor-position {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.rieltor-agency {
  font-size: 15px;
  color: var(--color-link);
  font-weight: 600;
  cursor: pointer;
}
.clickable {
  cursor: pointer;
  text-decoration: underline;
}
.actions-block {
  display: flex;
  gap: 12px;
  margin-bottom: 4px; /* Зменшено */
  justify-content: center;
}
.call-btn, .msg-btn {
  flex: 0 1 160px;
  padding: 10px 0;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
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
.msg-btn:disabled {
  background: var(--color-background-mute);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
  cursor: not-allowed;
}
.apartment-count {
  font-size: 1.1rem;
  color: var(--color-accent);
  font-weight: 500;
  margin-bottom: 0;
  text-align: center;
}
/* Кнопка Поділитися контактом рієлтора (в хедері) */
.share-btn-rieltor-header {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: var(--color-link);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  align-self: flex-start; /* Вирівняти по верху */
  margin-top: 4px; /* Невеликий відступ зверху */
}
.share-btn-rieltor-header:disabled {
  color: var(--color-hint-color);
  cursor: not-allowed;
}
.share-btn-rieltor-header svg {
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
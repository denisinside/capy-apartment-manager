<template>
  <div class="contracts-bg">
    <div class="contracts-container">
      <div class="contracts-header">
        <div class="contracts-title">Шаблони договорів</div>
        <div class="contracts-subtitle">Пустий шаблон договору</div>
      </div>
      <div class="contracts-pdf-block">
        <iframe
          class="contracts-pdf-viewer"
          :src="pdfUrl + '#toolbar=0'"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>
      <div class="contracts-actions">
        <button class="contracts-btn pdf" @click="downloadPDF">
          <span>⬇️ Завантажити PDF</span>
        </button>
        <button class="contracts-btn docx" @click="downloadDOCX">
          <span>⬇️ Завантажити DOC</span>
        </button>
        <button class="contracts-btn share" @click="shareContractViaBot" :disabled="isSharing">
          <span v-if="!isSharing">📤 Поділитися через бота</span>
          <span v-else>Обробка...</span>
        </button>
      </div>
      <div class="contracts-faq">
        <div class="faq-title">Часті питання</div>
        <div v-for="(item, idx) in faqs" :key="idx" class="faq-block">
          <div class="faq-q" @click="toggle(idx)">
            <span>{{ item.q }}</span>
            <span class="arrow" :class="{ open: openIdx === idx }">▼</span>
          </div>
          <transition name="fade">
            <div v-if="openIdx === idx" class="faq-a">
              <div v-html="item.a"></div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTelegram } from '../useTelegram'
import axios from 'axios'

const pdfUrl = '/zrazok-dogovoru-orendy-zhytla.pdf'
const docxUrl = '/zrazok-dogovoru-orendy-zhytla.docx'
const openIdx = ref(null)
const { tg, user, isReady } = useTelegram()
const isSharing = ref(false)

// API URL - переконайся, що він правильний для твого середовища
const API_BASE_URL = import.meta.env.VITE_SERVER_BASE || 'http://localhost:3000'

const faqs = [
  {
    q: 'Що таке договір оренди (найму) житла чи квартири?',
    a: 'Це документ, який укладається у письмовій формі про проживання конкретних осіб у певному житлі на визначений строк. Такий договір укладається у простій письмовій формі, тобто не вимагається обов\'язкового нотаріального посвідчення.'
  },
  {
    q: 'Чи обов\'язково укладати письмовий договір?',
    a: 'Так, письмова форма є обов\'язковою для захисту прав як орендаря, так і орендодавця.'
  },
  {
    q: 'Які основні пункти має містити договір?',
    a: 'Адреса житла, строк оренди, розмір плати, права та обов\'язки сторін, порядок розірвання, підписи.'
  },
  {
    q: 'Чи можна змінювати шаблон під свої потреби?',
    a: 'Так, шаблон можна редагувати під конкретну ситуацію, але важливо не прибирати ключові пункти.'
  },
  {
    q: 'Чи можна використовувати цей шаблон для оренди будинку?',
    a: 'Так, але потрібно змінити формулювання щодо типу житла.'
  },
]

function toggle(idx) {
  openIdx.value = openIdx.value === idx ? null : idx
}

// Скачування PDF через Telegram WebApp або fallback
function downloadPDF() {
  const url = window.location.origin + pdfUrl
  const filename = 'zrazok-dogovoru-orendy-zhytla.pdf'
  if (tg?.downloadFile) {
    tg.downloadFile({ url, file_name: filename }, (accepted) => {
      console.log('download PDF accepted:', accepted)
    })
  } else {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Скачування DOC через Telegram WebApp або fallback
function downloadDOCX() {
  const url = window.location.origin + docxUrl
  const filename = 'zrazok-dogovoru-orendy-zhytla.docx'
  if (tg?.downloadFile) {
    tg.downloadFile({ url, file_name: filename }, (accepted) => {
      console.log('download DOC accepted:', accepted)
    })
  } else {
    const link = document.createElement('a')
    link.href = docxUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

async function shareContractViaBot() {
  if (!tg || !isReady.value || !user.value?.id) {
    console.error('Telegram WebApp is not ready or user ID is missing.')
    alert('Помилка: Telegram WebApp не готовий або не вдалося отримати ID користувача.')
    return
  }

  if (isSharing.value) return
  isSharing.value = true

  try {
    const response = await axios.post(`/api/bot/prepare-contract-share`, {
      userId: user.value.id
    });

    if (response.data && response.data.success && response.data.preparedMessageId) {
      const preparedMessageId = response.data.preparedMessageId
      console.log('Received preparedMessageId:', preparedMessageId)

      if (tg.shareMessage) {
        tg.shareMessage(preparedMessageId, (sent) => {
          if (sent) {
            console.log('Message shared successfully via bot.')
            tg.showAlert('Посилання на договори успішно надіслано!')
          } else {
            console.warn('User cancelled sharing or it failed.')
            tg.showAlert('Надсилання скасовано.')
          }
        })
      } else {
        console.error('tg.shareMessage is not available in this Telegram version.')
        tg.showAlert('Функція поділитися повідомленням не доступна у вашій версії Telegram.')
      }
    } else {
      console.error('Failed to prepare message:', response.data)
      tg.showAlert('Помилка підготовки повідомлення для надсилання.')
    }

  } catch (error) {
    console.error('Error sharing contract via bot:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Невідома помилка сервера.'
    tg.showAlert(`Помилка: ${errorMessage}`)
  } finally {
    isSharing.value = false // Розблоковуємо кнопку
  }
}
</script>

<style scoped>
.contracts-bg {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  position: relative;
}
.contracts-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 0 80px 0;
  position: relative;
  z-index: 1;
}
.contracts-header {
  padding: 32px 0 12px 0;
  text-align: center;
}
.contracts-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-section-header-text);
  margin-bottom: 4px;
}
.contracts-subtitle {
  font-size: 1.1rem;
  color: var(--color-text);
  font-weight: 500;
  margin-bottom: 12px;
  background: var(--color-background-soft);
  padding: 6px 0;
  border-radius: 6px;
}
.contracts-pdf-block {
  background: var(--color-background-soft);
  border-radius: 12px 12px 0 0;
  box-shadow: 0 2px 8px #0001;
  margin: 0 12px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.contracts-pdf-viewer {
  width: 100%;
  min-height: 340px;
  height: 48vw;
  max-height: 420px;
  display: block;
  border: none;
  background: var(--color-background);
}
.contracts-actions {
  display: flex;
  gap: 12px;
  margin: 0 12px 12px 12px;
  justify-content: center;
}
.contracts-btn {
  flex: 1 1 0;
  padding: 12px 0;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  background: var(--color-background-soft);
  color: var(--color-text);
  text-align: center;
  text-decoration: none;
  box-shadow: 0 1px 4px #0001;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.contracts-btn.pdf {
  background: var(--color-background-soft);
  color: var(--color-link);
}
.contracts-btn.docx {
  background: var(--color-background-soft);
  color: var(--color-accent);
}
.contracts-btn.share {
  background: var(--color-button);
  color: var(--color-button-text);
}
.contracts-btn:active {
  filter: brightness(0.95);
}
.contracts-btn.share:disabled {
  background-color: var(--color-text-secondary);
  cursor: not-allowed;
  color: var(--color-background);
}
.contracts-faq {
  margin: 18px 12px 0 12px;
  background: var(--color-section-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
  border: 1px solid var(--color-border);
  padding: 12px 0 8px 0;
}
.faq-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-section-header-text);
  margin-bottom: 8px;
  text-align: center;
}
.faq-block {
  background: none;
  border-radius: 10px;
  margin: 0 8px 8px 8px;
  box-shadow: none;
  border: none;
  overflow: hidden;
}
.faq-q {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
  padding: 10px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  user-select: none;
  border-radius: 8px;
}
.arrow {
  font-size: 1.1em;
  transition: transform 0.18s;
}
.arrow.open {
  transform: rotate(180deg);
}
.faq-a {
  padding: 10px 8px 10px 8px;
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-background);
  animation: fadeIn 0.2s;
  border-radius: 8px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.18s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.contracts-footer-bg {
  width: 100%;
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}
.contracts-footer-img {
  width: 100%;
  min-height: 120px;
  object-fit: cover;
  opacity: 0.4;
  display: block;
}
</style> 
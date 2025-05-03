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
        <button class="contracts-btn share" @click="shareContract">
          <span>📤 Поділитися</span>
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
    <div class="contracts-footer-bg">
      <img src="/skyline.png" class="contracts-footer-img" alt="city" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTelegram } from '../useTelegram'
const pdfUrl = '/zrazok-dogovoru-orendy-zhytla.pdf'
const docxUrl = '/zrazok-dogovoru-orendy-zhytla.docx'
const openIdx = ref(null)
const { tg, user } = useTelegram()
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

// Копіювання посилання на додаток в буфер обміну
function shareContract() {
  const linkToCopy = 'https://t.me/capy_flat_bot?startapp=contracts';
  try {
    navigator.clipboard.writeText(linkToCopy).then(() => {
      tg.showAlert('Посилання скопійовано: ' + linkToCopy);
    }, (err) => {
      console.error('Could not copy text: ', err);
      tg.showAlert('Не вдалося скопіювати посилання');
    });
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    tg.showAlert('Не вдалося скопіювати посилання (помилка)');
  }
}
</script>

<style scoped>
.contracts-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7e6d4 0%, #fff 100%);
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
  color: #6d4c2c;
  margin-bottom: 4px;
}
.contracts-subtitle {
  font-size: 1.1rem;
  color: #222;
  font-weight: 500;
  margin-bottom: 12px;
  background: #2222;
  padding: 6px 0;
  border-radius: 6px;
}
.contracts-pdf-block {
  background: #fff;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 2px 8px #0001;
  margin: 0 12px;
  overflow: hidden;
  border: 1px solid #eab676;
}
.contracts-pdf-viewer {
  width: 100%;
  min-height: 340px;
  height: 48vw;
  max-height: 420px;
  display: block;
  border: none;
  background: #fff;
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
  background: #f7e6d4;
  color: #a05c3c;
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
  background: #ffe7d1;
}
.contracts-btn.docx {
  background: #f5f0f0;
}
.contracts-btn.share {
  background: #eab676;
  color: #fff;
}
.contracts-btn:active {
  background: #f5d6b6;
}
.contracts-faq {
  margin: 18px 12px 0 12px;
  background: #fff6ef;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
  border: 1px solid #eab676;
  padding: 12px 0 8px 0;
}
.faq-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #a05c3c;
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
  color: #a05c3c;
  padding: 10px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffe7d1;
  border-bottom: 1px solid #f5d6b6;
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
  color: #444;
  background: #fff;
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
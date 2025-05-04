<template>
  <div class="safety-bg">
    <div class="safety-container">
      <div class="safety-header">
        <div class="safety-title">Простір інтернет-гігієни</div>
        <div class="safety-subtitle"><span class="flag">🚩</span> Ред-флеги в оренді</div>
      </div>
      <div class="safety-list">
        <div v-for="(item, idx) in flags" :key="idx" class="safety-block">
          <div class="safety-block-title" @click="toggle(idx)">
            <span>{{ item.title }}</span>
            <span class="arrow" :class="{ open: openIdx === idx }">▼</span>
          </div>
          <transition name="fade">
            <div v-if="openIdx === idx" class="safety-block-desc">
              <div v-html="item.desc"></div>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <div class="safety-footer-bg">
      <img src="/skyline.png" class="safety-footer-img" alt="city" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const openIdx = ref(null)
const flags = [
  {
    title: 'Просять передоплату',
    desc: `<b>Перше і найважливіше правило:</b> ніколи не переказуйте гроші на банківські картки чи на мобільні номери до перегляду житла і знайомства з його орендодавцем або до підписання договору оренди.<br>Будь-які прохання перевести за посиланням щось оплатити або будь-якій людині — шахрайство.`
  },
  {
    title: 'Занадто привабливі фото',
    desc: `На фото квартира, будинок з новим ремонтом та (або) фото дуже привабливі. <br>Перевіряйте фото на оригінальність, щоб запобігти шахрайству. Google та інші системи допоможуть знайти фото на інших ресурсах.`
  },
  {
    title: 'Продаж бази даних квартир',
    desc: `Коли вам пропонують купити базу квартир — це шахрайство. Жодної реальної бази не існує.`
  },
  {
    title: 'Продаж послуг "перевірки"',
    desc: `Вам пропонують оплатити послугу перевірки квартири, але після оплати ви нічого не отримаєте.`
  },
  {
    title: 'Відсутність документів',
    desc: `Орендодавець не може надати документи на квартиру або відмовляється показати документи — це привід насторожитись.`
  },
  {
    title: 'Дуже низька ціна',
    desc: `Ціна значно нижча за ринкову — це майже завжди шахрайство.`
  },
  {
    title: 'Поспіх та тиск',
    desc: `Вас підганяють з рішенням, кажуть що "є ще 5 бажаючих" — це маніпуляція.`
  },
  {
    title: 'Відсутність огляду житла',
    desc: `Вам не дають подивитись квартиру особисто, пропонують лише онлайн-огляд — це шахрайство.`
  },
  {
    title: 'Оренда через "знайомих"',
    desc: `Вам кажуть, що власник за кордоном, а показує "знайомий" — це часто шахрайська схема.`
  },
  {
    title: 'Відсутність договору',
    desc: `Відмова укладати письмовий договір — це ризик для вас як орендаря.`
  },
  {
    title: 'Підозрілі реквізити',
    desc: `Вам дають реквізити на іншу особу, не співпадають ПІБ — це привід перевірити документи.`
  },
]
function toggle(idx) {
  openIdx.value = openIdx.value === idx ? null : idx
}
</script>

<style scoped>
.safety-bg {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  position: relative;
}
.safety-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 0 80px 0;
  position: relative;
  z-index: 1;
}
.safety-header {
  padding: 32px 0 12px 0;
  text-align: center;
}
.safety-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-section-header-text);
  margin-bottom: 4px;
}
.safety-subtitle {
  font-size: 1.1rem;
  color: var(--color-destructive);
  font-weight: 500;
  margin-bottom: 12px;
}
.flag {
  font-size: 1.2em;
  margin-right: 4px;
}
.safety-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 12px;
}
.safety-block {
  background: var(--color-section-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
  border: 1px solid var(--color-accent);
  overflow: hidden;
  transition: box-shadow 0.18s;
  width: 100%;
  box-sizing: border-box;
}
.safety-block-title {
  width: 100%;
  box-sizing: border-box;
  font-size: 1.08rem;
  font-weight: 600;
  color: var(--color-section-header-text);
  padding: 14px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  user-select: none;
}
.arrow {
  font-size: 1.1em;
  transition: transform 0.18s;
}
.arrow.open {
  transform: rotate(180deg);
}
.safety-block-desc {
  padding: 14px 16px 14px 16px;
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-background);
  animation: fadeIn 0.2s;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.18s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.safety-footer-bg {
  width: 100%;
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}
.safety-footer-img {
  width: 100%;
  min-height: 120px;
  object-fit: cover;
  opacity: 0.4;
  display: block;
}
</style> 
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useTelegram } from './useTelegram'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const { startParam, isReady, clearStartParam } = useTelegram();

app.use(createPinia())
app.use(router)

router.isReady().then(() => {
  if (isReady.value && startParam.value) {

    const processedStartParam = startParam.value;
    // Ключ для sessionStorage, унікальний для цього startParam
    const sessionStorageKey = `startParamProcessed_${processedStartParam}`;

    // Перевіряємо, чи цей startParam вже оброблено в поточній сесії
    if (!sessionStorage.getItem(sessionStorageKey)) {
      console.log(`Processing startParam: ${processedStartParam}`);
      // Розділяємо параметр на частини за допомогою '_'
      const parts = processedStartParam.split('_');
      const routeName = parts[0];
      const routeParams = parts.slice(1); // Решта частин - параметри

      // Викликаємо функцію очищення Vue ref (хоча це вже не головний механізм)
      clearStartParam();

      // Позначаємо цей startParam як оброблений у sessionStorage
      try {
        sessionStorage.setItem(sessionStorageKey, 'true');
      } catch (e) {
        console.error('Failed to set sessionStorage item:', e);
        // Обробка помилки, якщо sessionStorage недоступний або переповнений
      }

      // Перевіряємо, чи існує маршрут з таким іменем
      if (router.hasRoute(routeName)) {
        let navigationTarget = { name: routeName };

        // Спробуємо зіставити параметри
        if (routeName === 'apartment-details' && routeParams.length === 1) {
          navigationTarget.params = { id: routeParams[0] };
        } else if (routeParams.length > 0) {
          console.warn(`Route "${routeName}" found, but parameter handling for "${processedStartParam}" is not implemented.`);
        }

        router.push(navigationTarget).catch(err => {
          console.error('Navigation Error:', err);
          router.push({ name: 'map' });
        });
      } else {
        console.warn(`Route with name "${routeName}" not found (from startParam: "${processedStartParam}").`);
        router.push({ name: 'map' });
      }
    } else {
      console.log(`StartParam "${processedStartParam}" already processed in this session.`);
      // Якщо вже оброблено, очищаємо Vue ref, щоб він не заважав
      clearStartParam();
      // Можливо, тут варто перенаправити на 'map' або залишити поточну сторінку
       // router.push({ name: 'map' });
    }
  } else {
     // Якщо немає startParam, можна теж перейти на дефолтний маршрут
     // router.push({ name: 'map' });
  }

  app.mount('#app')
});

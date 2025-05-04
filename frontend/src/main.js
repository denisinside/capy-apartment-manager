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
  const { isReady, startParam, clearStartParam } = useTelegram();

  if (isReady.value && startParam.value) {
    const apartmentId = startParam.value;
    const sessionStorageKey = `startParamProcessed_${apartmentId}`;

    if (apartmentId && !sessionStorage.getItem(sessionStorageKey)) {
      console.log(`Processing startParam as apartment ID: ${apartmentId}`);
      
      try {
        sessionStorage.setItem(sessionStorageKey, 'true');
      } catch (e) {
        console.error('Failed to set sessionStorage item:', e);
      }
      
      router.push({ name: 'apartment-details', params: { id: apartmentId } })
        .then(() => {
          console.log(`Successfully navigated to apartment ${apartmentId}`);
          clearStartParam();
        })
        .catch(err => {
          try {
            router.push({ name: 'rieltor', params: { name: decodeURIComponent(apartmentId) } });
          } catch (e) {
            console.error('Navigation Error from startParam:', err);
            router.push({ name: '/' }); 
          }
          clearStartParam();
        });
    } else if (sessionStorage.getItem(sessionStorageKey)) {
      console.log(`StartParam "${apartmentId}" already processed in this session.`);
      clearStartParam();
    } else {
       console.warn("Received empty or invalid startParam:", startParam.value);
       clearStartParam();
    }
  } else if (isReady.value && !startParam.value) {
    console.log('App ready, no startParam found.');
    app.mount('#app');
  } else {
    app.mount('#app');
  }

  if (!app._container) {
      app.mount('#app');
  }
});

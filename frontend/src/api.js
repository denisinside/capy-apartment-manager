const API_BASE = '/api/apartments';
import { useFavouritesStore } from './stores/favourites';
import { useSubscriptionsStore } from './stores/subscriptions';
import axios from 'axios'; // Додано axios для зручності

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Always include Telegram WebApp initData header for validation on server
const originalFetch = window.fetch.bind(window);
window.fetch = (resource, init = {}) => {
  const method = (init.method || 'GET').toUpperCase();
  let initDataString = null;
  if (window.Telegram && window.Telegram.WebApp) {
    initDataString = window.Telegram.WebApp.initData || null;
  }
  const headers = { ...(init.headers || {}) };
  if (initDataString) {
    headers['X-Telegram-Init-Data'] = initDataString;
  }
  // console.log('[API] Fetch Override ->', method, resource, 'initDataPresent:', !!initDataString, 'headers:', headers);
  return originalFetch(resource, { ...init, headers })
    .then(res => {
      const validatorStatus = res.headers.get('X-Telegram-Validator');
      const validatorError = res.headers.get('X-Telegram-Validator-Error');
      if (validatorStatus !== 'ok') {
          console.warn('[API] Telegram validation status:', validatorStatus, 'Error:', validatorError);
      }
      // console.log('[API] Fetch Response ->', resource, 'status:', res.status, 'Validator:', validatorStatus);
      return res;
    });
};

export async function fetchApartments(params = {}) {
  const url = new URL(API_BASE, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.append(key, value);
  });
  const res = await fetch(url, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch apartments');
  return res.json();
}

export async function fetchApartmentById(id) {
  const res = await fetch(`${API_BASE}/${id}`, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch apartment');
  return res.json();
}

export async function fetchDistricts(city) {
  const res = await fetch(`/api/apartments/districts?city=${encodeURIComponent(city)}`, {
    headers: defaultHeaders
  });
  if (!res.ok) throw new Error('Failed to fetch districts');
  return res.json();
}

export async function fetchSubwayStations(city) {
  const res = await fetch(`/api/apartments/subway-stations?city=${encodeURIComponent(city)}`, {
    headers: defaultHeaders
  });
  if (!res.ok) throw new Error('Failed to fetch subway stations');
  return res.json();
}

export async function fetchResidentialComplexes(city) {
  const res = await fetch(`/api/apartments/residential-complexes?city=${encodeURIComponent(city)}`, {
    headers: defaultHeaders
  });
  if (!res.ok) throw new Error('Failed to fetch residential complexes');
  return res.json();
}

export async function fetchLandmarks(city) {
  const res = await fetch(`/api/apartments/landmarks?city=${encodeURIComponent(city)}`, {
    headers: defaultHeaders
  });
  if (!res.ok) throw new Error('Failed to fetch landmarks');
  return res.json();
}

export async function fetchRieltors(city) {
  const res = await fetch(`/api/apartments/rieltors?city=${encodeURIComponent(city)}`, {
    headers: defaultHeaders
  });
  if (!res.ok) throw new Error('Failed to fetch rieltors');
  return res.json();
}

export async function fetchAgencies(city) {
  const res = await fetch(`/api/apartments/agencies?city=${encodeURIComponent(city)}`, {
    headers: defaultHeaders
  });
  if (!res.ok) throw new Error('Failed to fetch agencies');
  return res.json();
}

// --- API для обраних квартир ---

export async function fetchFavourites(userId) {
  const res = await fetch(`/api/favourites/${userId}/`, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch favourites');
  return res.json();
}

export async function addToFavourites(userId, apartmentId) {
  const res = await fetch(`/api/favourites/`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ userId, apartmentId })
  });
  if (!res.ok) throw new Error('Failed to add to favourites');
  return res.json();
}

export async function removeFromFavourites(userId, apartmentId) {
  const res = await fetch(`/api/favourites/${userId}/${apartmentId}/`, {
    method: 'DELETE',
    headers: defaultHeaders
  });
  if (!res.ok) throw new Error('Failed to remove from favourites');
  return res.json();
}

// --- API для підписок ---

export async function fetchSubscriptions(userId) {
  const res = await fetch(`/api/subscriptions/${userId}/`, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch subscriptions');
  return res.json();
}

export async function createSubscription(userId, subscriptionOptions) {
  const res = await fetch(`/api/subscriptions/`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ userId, subscriptionOptions })
  });
  if (!res.ok) throw new Error('Failed to create subscription');
  return res.json();
}

export async function updateSubscription(subscriptionId, userId, subscriptionOptions) {
  const res = await fetch(`/api/subscriptions/${subscriptionId}/`, {
    method: 'PUT',
    headers: defaultHeaders,
    body: JSON.stringify({ userId, subscriptionOptions })
  });
  if (!res.ok) {
      const errorData = await res.json().catch(() => ({})); // Спробувати отримати тіло помилки
      throw new Error(errorData.message || 'Failed to update subscription');
  }
  return res.json();
}

export async function deleteSubscription(subscriptionId) {
  const res = await fetch(`/api/subscriptions/${subscriptionId}/`, {
    method: 'DELETE',
    headers: defaultHeaders
  });
  if (!res.ok) throw new Error('Failed to delete subscription');
  return res.json();
}

export async function fetchCities() {
  const res = await fetch('/api/apartments/cities', { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch cities');
  return res.json();
}

export async function fetchApartmentsByRieltor(rieltorName) {
  const res = await fetch(`/api/apartments/by-rieltor?name=${encodeURIComponent(rieltorName)}`, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch apartments by rieltor');
  return res.json();
}

export async function fetchApartmentsByAgency(agencyName) {
  const res = await fetch(`/api/apartments/by-agency?name=${encodeURIComponent(agencyName)}`, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch apartments by agency');
  return res.json();
}

// Отримати квартири на перегляд для користувача
export async function getApartmentsForReview(userId) {
  const res = await fetch(`/api/subscriptions/review/${userId}/`, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch apartments for review');
  return res.json();
}

// Видалити квартиру зі списку сповіщень
export async function removeNotifiedApartment(userId, apartmentId) {
  const res = await fetch(`/api/subscriptions/review/${userId}/${apartmentId}/`, {
    method: 'DELETE',
    headers: defaultHeaders
  });
  if (!res.ok) throw new Error('Failed to remove notified apartment');
  return res.json();
}

// Нова функція для отримання рієлторів за назвою агентства
export async function fetchRieltorsByAgencyName(agencyName) {
  const res = await fetch(`/api/apartments/agencies/${encodeURIComponent(agencyName)}/rieltors`, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch realtors by agency');
  return res.json();
}

// Fetch full details of favourite apartments for a user
export async function fetchFavouriteApartments(userId) {
  const res = await fetch(`/api/favourites/${userId}/apartments`, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Failed to fetch favourite apartments');
  return res.json();
}

// --- API для взаємодії з ботом ---

/**
 * Підготувати повідомлення для поширення контакту рієлтора (для кнопки "Поділитися").
 * @param {object} data - Дані для підготовки повідомлення.
 * @param {number} data.userId - ID користувача Telegram.
 * @param {string} data.rieltorName - Ім'я рієлтора.
 * @param {string} data.rieltorPhoneNumber - Номер телефону рієлтора.
 * @param {string} [data.rieltorPhotoUrl] - URL фото рієлтора (необов'язково).
 * @param {string} [data.apartmentId] - ID квартири (необов'язково, для кнопки "Переглянути це оголошення").
 * @returns {Promise<object>} Результат запиту, що містить preparedMessageId.
 */
export async function prepareRieltorShare(data) {
    console.log('[API] Preparing rieltor share with data:', data);
    const response = await axios.post(`/api/bot/prepare-rieltor-share`, data);
    if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to prepare rieltor share message');
    }
    console.log('[API] Prepared rieltor share response:', response.data);
    return response.data;
}

/**
 * Надіслати контакт рієлтора напряму користувачу в чат (для кнопки "Набрати").
 * @param {object} data - Дані для надсилання контакту.
 * @param {number} data.userId - ID користувача Telegram.
 * @param {string} data.rieltorName - Ім'я рієлтора.
 * @param {string} data.rieltorPhoneNumber - Номер телефону рієлтора.
 * @param {string} [data.rieltorPhotoUrl] - URL фото рієлтора (необов'язково).
 * @param {string} [data.apartmentId] - ID квартири (необов'язково, для кнопки "Переглянути це оголошення").
 * @returns {Promise<object>} Результат запиту.
 */
export async function sendRieltorContactToUser(data) {
    console.log('[API] Sending rieltor contact directly to user:', data);
    // Використовуємо fetch, оскільки axios може мати проблеми з обробкою помилок 4xx/5xx без try-catch
    const res = await fetch(`/api/bot/send-rieltor-contact-to-user`, {
        method: 'POST',
        headers: defaultHeaders, // Надсилаємо заголовки за замовчуванням
        body: JSON.stringify(data)
    });
    const responseData = await res.json(); // Завжди намагаємося розпарсити JSON
    if (!res.ok) {
        // Викидаємо помилку з повідомленням від сервера, якщо воно є
        throw new Error(responseData?.message || `Failed to send rieltor contact. Status: ${res.status}`);
    }
    console.log('[API] Send rieltor contact response:', responseData);
    return responseData;
}


/**
 * Підготувати повідомлення для поширення оголошення.
 * @param {object} data - Дані для підготовки повідомлення.
 * @param {number} data.userId - ID користувача Telegram.
 * @param {string} data.apartmentId - ID квартири.
 * @returns {Promise<object>} Результат запиту, що містить preparedMessageId.
 */
export async function prepareApartmentShare(data) {
    console.log('[API] Preparing apartment share with data:', data);
    const response = await axios.post(`/api/bot/prepare-apartment-share`, data);
    if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to prepare apartment share message');
    }
    console.log('[API] Prepared apartment share response:', response.data);
    return response.data;
}
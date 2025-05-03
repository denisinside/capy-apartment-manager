const API_BASE = '/api/apartments';
import { useFavouritesStore } from './stores/favourites';
import { useSubscriptionsStore } from './stores/subscriptions';

const defaultHeaders = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
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
const API_BASE = '/api/apartments';

export async function fetchApartments(params = {}) {
  const url = new URL(API_BASE, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.append(key, value);
  });
  const res = await fetch(url, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch apartments');
  return res.json();
}

export async function fetchApartmentById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch apartment');
  return res.json();
} 
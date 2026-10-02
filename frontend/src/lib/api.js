import { emitUnauthorized } from './authEvents';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

const headers = (isJson = true) => {
  const h = {};
  if (isJson) h['Content-Type'] = 'application/json';
  return h;
};

async function parseResponse(res) {
  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  if (res.status === 401) {
    emitUnauthorized();
  }
  if (!res.ok) {
    throw new Error(body.message || 'Request failed');
  }
  return body;
}

const api = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: headers(),
      credentials: 'include',
    });
    return parseResponse(res);
  },

  post: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return parseResponse(res);
  },

  put: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: headers(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return parseResponse(res);
  },

  patch: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: headers(),
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse(res);
  },

  upload: async (path, formData) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return parseResponse(res);
  },

  delete: async (path, options = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: headers(),
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    return parseResponse(res);
  },

  getFileUrl: (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  },
};

export default api;
export { API_BASE };

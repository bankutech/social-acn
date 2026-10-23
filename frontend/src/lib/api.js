const API_BASE = (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== null)
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

const getToken = () => {
  const user = localStorage.getItem('acn_user');
  if (user) {
    try { return JSON.parse(user).token; } catch { return null; }
  }
  return null;
};

const headers = (isJson = true) => {
  const h = {};
  if (isJson) h['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const parseResponse = async (res, defaultMsg = 'Request failed') => {
  if (!res.ok) {
    let errMsg = defaultMsg;
    try {
      const data = await res.json();
      errMsg = data.message || errMsg;
    } catch {
      try {
        const text = await res.text();
        if (text && text.length < 200) errMsg = text;
      } catch {}
    }
    if (res.status === 401 && typeof window !== 'undefined' && !res.url.includes('/api/auth/login') && !res.url.includes('/api/auth/register')) {
      if (localStorage.getItem('acn_user')) {
        localStorage.removeItem('acn_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    throw new Error(errMsg);
  }
  return res.json();
};

const api = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: headers() });
    return parseResponse(res, 'Request failed');
  },

  post: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    });
    return parseResponse(res, 'Request failed');
  },

  put: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body)
    });
    return parseResponse(res, 'Request failed');
  },

  upload: async (path, formData) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    return parseResponse(res, 'Upload failed');
  },

  patch: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body)
    });
    return parseResponse(res, 'Request failed');
  },

  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: headers()
    });
    return parseResponse(res, 'Request failed');
  },

  getFileUrl: (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  }
};

export default api;
export { API_BASE, getToken };

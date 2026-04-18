const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

const api = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: headers() });
    if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
    return res.json();
  },

  post: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
    return res.json();
  },

  put: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
    return res.json();
  },

  upload: async (path, formData) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
    return res.json();
  },

  getFileUrl: (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  }
};

export default api;
export { API_BASE, getToken };

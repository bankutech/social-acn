import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  googleLogin: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('acn_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        connectSocket(parsed._id);
      } catch { localStorage.removeItem('acn_user'); }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('acn_user', JSON.stringify(data));
    setUser(data);
    connectSocket(data._id);
    return data;
  };

  const signup = async (formData) => {
    const data = await api.post('/api/auth/register', formData);
    localStorage.setItem('acn_user', JSON.stringify(data));
    setUser(data);
    connectSocket(data._id);
    return data;
  };

  const googleLogin = async (idToken) => {
    const data = await api.post('/api/auth/google', { idToken });
    localStorage.setItem('acn_user', JSON.stringify(data));
    setUser(data);
    connectSocket(data._id);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('acn_user');
    disconnectSocket();
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('acn_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext) || { user: null, loading: true };
export default AuthContext;

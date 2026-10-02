import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { API_ROUTES } from '../config/apiRoutes';
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
    const checkAuth = async () => {
      try {
        const data = await api.get(API_ROUTES.AUTH_ME);
        setUser(data);
        connectSocket(data._id);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.post(API_ROUTES.AUTH_LOGIN, { email, password });
    setUser(data);
    connectSocket(data._id);
    return data;
  };

  const signup = async (formData) => {
    const data = await api.post(API_ROUTES.AUTH_REGISTER, formData);
    setUser(data);
    connectSocket(data._id);
    return data;
  };

  const googleLogin = async (idToken) => {
    const data = await api.post(API_ROUTES.AUTH_GOOGLE, { idToken });
    setUser(data);
    connectSocket(data._id);
    return data;
  };

  const logout = async () => {
    try {
      await api.post(API_ROUTES.AUTH_LOGOUT);
    } catch (e) {}
    disconnectSocket();
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return null;
      // Prevent overwriting critical auth fields
      const { _id, email, role, ...safeUpdates } = updates;
      return { ...prev, ...safeUpdates };
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext) || { user: null, loading: true };
export default AuthContext;

import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { AUTH_STORAGE_KEY } from '../api/api';
import { ROLE_NAME, type Role } from '../constants/roles';
import { useUI } from './UIContext';

interface AuthUser {
  role: Role;
  displayName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: Role;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (role: Role, pin: string) => Promise<boolean>;
  logout: () => void;
  toggleRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { toast, prompt } = useUI();

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!token) {
        setIsReady(true);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      } finally {
        setIsReady(true);
      }
    };

    void bootstrap();
  }, []);

  const login = async (role: Role, pin: string) => {
    try {
      const res = await api.post('/auth/verify', { role, pin });
      if (res.data.success) {
        localStorage.setItem(AUTH_STORAGE_KEY, res.data.token);
        setUser(res.data.user);
        toast(`App dang o che do ${ROLE_NAME[res.data.user.role as Role]}`, 'success');
        return true;
      }
    } catch (err: any) {
      toast(err.response?.data?.message || 'Dang nhap that bai', 'error');
    }

    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    toast('Da dang xuat. Hay chon lai nguoi dang dung app.', 'info');
  };

  const toggleRole = async () => {
    if (user?.role === 'boyfriend') {
      logout();
      return;
    }

    const pin = await prompt(`Nhap PIN cua ${ROLE_NAME.boyfriend} de chuyen sang ${ROLE_NAME.boyfriend}`, '****', 'password');
    if (!pin) return;

    await login('boyfriend', pin);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? 'girlfriend',
        isReady,
        isAuthenticated: !!user,
        login,
        logout,
        toggleRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

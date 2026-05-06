import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { AUTH_STORAGE_KEY } from '../api/api';
import { ROLE_NAME, isRole, type Role } from '../constants/roles';
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
  switchingRole: Role | null;
  login: (role: Role, pin: string, options?: { silent?: boolean }) => Promise<boolean>;
  logout: () => void;
  toggleRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeAuthUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<AuthUser>;
  if (!isRole(candidate.role)) return null;

  return {
    role: candidate.role,
    displayName: typeof candidate.displayName === 'string' && candidate.displayName.trim()
      ? candidate.displayName
      : ROLE_NAME[candidate.role],
  };
};

const getOppositeRole = (role: Role): Role => (role === 'boyfriend' ? 'girlfriend' : 'boyfriend');

const getAuthErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') {
      return response.data.message;
    }
  }

  return 'Đăng nhập thất bại';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<Role | null>(null);
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
        const currentUser = normalizeAuthUser(res.data.user);
        if (!currentUser) throw new Error('INVALID_AUTH_USER');
        setUser(currentUser);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      } finally {
        setIsReady(true);
      }
    };

    void bootstrap();
  }, []);

  const login = async (role: Role, pin: string, options: { silent?: boolean } = {}) => {
    try {
      const res = await api.post('/auth/verify', { role, pin });
      const nextUser = normalizeAuthUser(res.data.user);

      if (res.data.success && nextUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, res.data.token);
        setUser(nextUser);
        toast(`App đang ở góc ${ROLE_NAME[nextUser.role]}`, 'success');
        return true;
      }
    } catch (error: unknown) {
      if (!options.silent) {
        toast(getAuthErrorMessage(error), 'error');
      }
    }

    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    toast('Đã rời phiên hiện tại. Hãy chọn lại người đang dùng app.', 'info');
  };

  const toggleRole = async () => {
    if (!user) {
      return;
    }

    const nextRole = getOppositeRole(user.role);
    setSwitchingRole(nextRole);

    try {
      if (nextRole === 'boyfriend') {
        const pin = await prompt(`Đang đổi từ ${ROLE_NAME[user.role]} sang ${ROLE_NAME.boyfriend}. Nhập PIN của ${ROLE_NAME.boyfriend} để mở đúng góc nhìn.`, '****', 'password');
        if (!pin) return;

        await login(nextRole, pin);
        return;
      }

      const switched = await login(nextRole, '', { silent: true });
      if (switched) return;

      const pin = await prompt(`Đang đổi từ ${ROLE_NAME[user.role]} sang ${ROLE_NAME.girlfriend}. Nhập PIN của ${ROLE_NAME.girlfriend} nếu góc này đang được khóa.`, '****', 'password');
      if (!pin) return;
      await login(nextRole, pin);
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? 'girlfriend',
        isReady,
        isAuthenticated: !!user,
        switchingRole,
        login,
        logout,
        toggleRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Context modules intentionally export the provider and its hook together.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

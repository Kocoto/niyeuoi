import React, { createContext, useContext, useState } from 'react';
import api from '../api/api';
import { useUI } from './UIContext';

type Role = 'boyfriend' | 'girlfriend';

interface AuthContextType {
  role: Role;
  toggleRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem('user-role') as Role) || 'girlfriend';
  });
  const { toast, prompt } = useUI();

  const toggleRole = async () => {
    if (role === 'girlfriend') {
      const pin = await prompt('Nhập mã PIN để vào chế độ Quản lý:', '••••••', 'password');
      if (!pin) return;
      try {
        const res = await api.post('/auth/verify', { pin });
        if (res.data.success) {
          setRole('boyfriend');
          localStorage.setItem('user-role', 'boyfriend');
          toast('Đã vào chế độ Quản lý 🔑', 'success');
        }
      } catch (err: any) {
        toast(err.response?.data?.message || 'Mã PIN không chính xác!', 'error');
      }
    } else {
      setRole('girlfriend');
      localStorage.setItem('user-role', 'girlfriend');
      toast('Đã thoát chế độ Quản lý', 'info');
    }
  };

  return (
    <AuthContext.Provider value={{ role, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

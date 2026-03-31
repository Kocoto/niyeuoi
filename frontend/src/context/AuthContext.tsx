import React, { createContext, useContext, useState } from 'react';

import api from '../api/api';

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

  const toggleRole = async () => {
    if (role === 'girlfriend') {
      const pin = window.prompt('Nhập mã PIN để vào chế độ Quản lý:');
      try {
        const res = await api.post('/auth/verify', { pin });
        if (res.data.success) {
          setRole('boyfriend');
          localStorage.setItem('user-role', 'boyfriend');
          // Trong tương lai có thể lưu token: localStorage.setItem('token', res.data.token);
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Mã PIN không chính xác!');
      }
    } else {
      setRole('girlfriend');
      localStorage.setItem('user-role', 'girlfriend');
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

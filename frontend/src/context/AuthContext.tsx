import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'boyfriend' | 'girlfriend';

interface AuthContextType {
  role: Role;
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem('user-role') as Role) || 'girlfriend';
  });

  const toggleRole = () => {
    if (role === 'girlfriend') {
      const pin = window.prompt('Nhập mã PIN để vào chế độ Quản lý:');
      if (pin === '1234') { // Bạn có thể đổi mã PIN tại đây
        setRole('boyfriend');
        localStorage.setItem('user-role', 'boyfriend');
      } else {
        alert('Mã PIN không chính xác! Chế độ bí mật được bảo vệ. 😉');
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

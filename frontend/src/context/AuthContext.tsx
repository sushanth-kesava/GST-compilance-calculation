import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface UserProfile {
  userId: string;
  username: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  register: (payload: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const response: any = await api.post('/auth/login', { username: usernameOrEmail, password });
      if (response.success && response.data) {
        const { accessToken, refreshToken, userId, username, email, roles } = response.data;
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        const profile: UserProfile = { userId, username, email, roles };
        localStorage.setItem('user', JSON.stringify(profile));
        
        setToken(accessToken);
        setUser(profile);
        return response;
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const register = async (payload: any) => {
    return await api.post('/auth/register', payload);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

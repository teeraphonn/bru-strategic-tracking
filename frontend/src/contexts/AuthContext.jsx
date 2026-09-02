import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (err) {
      console.error('Session validation failed:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  };

  const changePassword = async (oldPassword, newPassword) => {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, changePassword, refreshUser: checkUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};

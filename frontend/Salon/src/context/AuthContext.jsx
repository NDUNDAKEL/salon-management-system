// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Navigate based on role
      if (userData.is_admin) {
        navigate('/admin');
      } else if (userData.is_stylist) {
        navigate('/stylist');
      } else {
        navigate('/customer-dashboard'); // fallback
      }
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const logout = async (showToast = true) => {
    const token = localStorage.getItem('token');

    try {
      if (token) {
        await axios.delete('/auth/logout', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (showToast) toast.success('Logged out successfully');
      }
    } catch (err) {
      console.error('Logout error:', err);
      if (showToast) toast.error(err.response?.data?.message || 'Logout failed');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login', { replace: true });

      if (showToast) {
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  };

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get('/auth/current_user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      if ([401, 422].includes(err.response?.status)) {
        logout();
      }
      console.error('Fetch user error:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

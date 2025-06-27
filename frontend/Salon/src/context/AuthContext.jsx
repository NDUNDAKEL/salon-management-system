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
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      
      // Handle navigation based on user role
      if (res.data.user.is_admin) {
        navigate('/admin');
      } else if (res.data.user.is_stylist) {
        navigate('/stylist/dashboard');
      } else {
        navigate('/customer-dashboard');
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
        if (showToast) {
          toast.success('Logged out successfully');
        }
      }
    } catch (err) {
      console.error('Logout error:', err);
      if (showToast) {
        toast.error(err.response?.data?.message || 'Logout failed');
      }
    } finally {
      // Always perform client-side cleanup
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login', { replace: true });
      
      // Optional: Force refresh if needed
      if (showToast) {
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  };
// src/context/AuthContext.js
const fetchUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await axios.get('/auth/current_user', { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data)); // Ensure user is stored
    return res.data; // Return user data for other components to use
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 422) {
      logout(); // Handle both unauthorized and unprocessable entity
    }
    console.error('Fetch user error:', err);
    return null;
  }
};

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout,setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
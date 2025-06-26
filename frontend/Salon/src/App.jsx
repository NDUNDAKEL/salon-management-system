import React from 'react';
import { Routes, Route } from 'react-router-dom';

import AdminDashboard from './pages/Admin/AdminDashboard';
import ReviewStylist from './pages/Reviews/ReviewStylist';
import ReviewSalon from './pages/Reviews/ReviewSalon';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login'; // Optional: include if you have a login page
import Home from './pages/Home'; // Optional: include if you have a home page
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/review/stylist/:stylistId"
        element={
          <ProtectedRoute>
            <ReviewStylist />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review/salon/:salonId"
        element={
          <ProtectedRoute>
            <ReviewSalon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<p className="p-6">Page not found</p>} />
    </Routes>
  );
}

export default App;

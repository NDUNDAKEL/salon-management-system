// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminDashboard from './pages/Admin/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import ReviewStylist from './pages/Reviews/ReviewStylist';
import ReviewSalon from './pages/Reviews/ReviewSalon';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';

function App() {

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Customer Dashboard Route */}
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        
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
    </AuthProvider>
    </>
  
  );
}

export default App;
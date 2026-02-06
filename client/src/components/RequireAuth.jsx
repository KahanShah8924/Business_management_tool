import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function RequireAuth() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    // Force cleanup if we somehow got here without a token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // Ensure user data is also cleared
    }
    return <Navigate to="/login" replace />;
  }

  // Optional: Decode token to check expiration client-side if needed, 
  // but for now existence check + backend 401 handling is the baseline.

  return <Outlet />;
}


import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Groups } from './pages/Groups';
import { GroupDetails } from './pages/GroupDetails';
import { CreateGroup } from './pages/CreateGroup';
import { Resources } from './pages/Resources';
import { UploadResource } from './pages/UploadResource';
import { Matching } from './pages/Matching';
import { Sessions } from './pages/Sessions';
import { CreateSession } from './pages/CreateSession';
import { Profile } from './pages/Profile';
import { Toaster } from 'react-hot-toast';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><Login onLogin={() => window.location.href = '/dashboard'} /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
        <Route path="/groups/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
        <Route path="/groups/create" element={<PrivateRoute><CreateGroup /></PrivateRoute>} />
        <Route path="/resources" element={<PrivateRoute><Resources /></PrivateRoute>} />
        <Route path="/resources/upload" element={<PrivateRoute><UploadResource /></PrivateRoute>} />
        <Route path="/matching" element={<PrivateRoute><Matching /></PrivateRoute>} />
        <Route path="/sessions" element={<PrivateRoute><Sessions /></PrivateRoute>} />
        <Route path="/sessions/create" element={<PrivateRoute><CreateSession /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
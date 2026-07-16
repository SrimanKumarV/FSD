import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CompleteProfileOnboarding from '../profile/CompleteProfileOnboarding';
import MandatoryTasksOverlay from '../profile/MandatoryTasksOverlay';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, isLoading, isAdmin, updateUser } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin access if required
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Force onboarding for missing mandatory fields
  if (user && (!user.country || !user.college)) {
    return (
      <>
        {children}
        <CompleteProfileOnboarding 
          user={user} 
          onComplete={(updatedUser) => updateUser(updatedUser)} 
        />
        <MandatoryTasksOverlay user={user} />
      </>
    );
  }

  // Render children if authenticated and authorized
  return (
    <>
      {children}
      <MandatoryTasksOverlay user={user} />
    </>
  );
};

export default ProtectedRoute;

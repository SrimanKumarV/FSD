import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { setAuthUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  // Update user profile
  const updateProfile = async (userData, role = null) => {
    try {
      setIsUpdating(true);
      let response;
      if (role) {
        response = await api.put(`/users/profile/${role}`, userData);
      } else {
        response = await api.put('/users/profile', userData);
      }
      
      setAuthUser(response.data.user);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsUpdating(false);
    }
  };

  const value = {
    updateProfile,
    isUpdating
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

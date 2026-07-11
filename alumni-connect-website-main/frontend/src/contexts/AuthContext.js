import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Create context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Sync token to localStorage
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('token', state.token);
    } else {
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const controller = new AbortController();

    const checkAuth = async () => {
      if (state.token) {
        try {
          const response = await api.get('/auth/me', {
            signal: controller.signal
          });
          if (!controller.signal.aborted) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user: response.data.user, token: state.token }
            });
          }
        } catch (error) {
          if (error.name === 'CanceledError' || error.name === 'AbortError') return;
          console.error('Auth check failed:', error);
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();

    // Listen for forced logout fired by the API interceptor on 401
    const handleForceLogout = () => {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };
    window.addEventListener('auth:logout', handleForceLogout);

    return () => {
      controller.abort();
      window.removeEventListener('auth:logout', handleForceLogout);
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { user, token } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const requiresVerification = error.response?.data?.requiresVerification;
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: message
      });
      if (!requiresVerification) toast.error(message);
      return { 
        success: false, 
        error: message, 
        requiresVerification, 
        email: error.response?.data?.email || email 
      };
    }
  };

  // Google Login function
  const loginWithGoogle = async (credential) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await api.post('/auth/google', {
        credential
      });

      const { user, token, isNewUser, message } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });

      toast.success(message || 'Google Login successful!');
      return { success: true, isNewUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Google Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // GitHub Login function
  const loginWithGithub = async (code) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await api.post('/auth/github', {
        code
      });

      const { user, token, isNewUser, message } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });

      toast.success(message || 'GitHub Login successful!');
      return { success: true, isNewUser };
    } catch (error) {
      const message = error.response?.data?.message || 'GitHub Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const response = await api.post('/auth/register', userData);
      
      const { user, token, message, requiresVerification } = response.data;
      
      if (requiresVerification) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        toast.success(message || 'Registration successful!');
        return { success: true, requiresVerification: true, email: user.email };
      }
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user, token }
      });

      toast.success(message || 'Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateUser = async (userData, role = null) => {
    try {
      let response;
      if (role) {
        response = await api.put(`/users/profile/${role}`, userData);
      } else {
        response = await api.put('/users/profile', userData);
      }
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: response.data.user
      });
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Reset password
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Verify email
  const verifyEmail = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-email', { email, otp });
      const { user, token, message } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });
      
      toast.success(message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Resend verification email
  const resendVerification = async () => {
    try {
      const response = await api.post('/auth/resend-verification');
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user?.role === 'admin';
  };

  // Check if user is alumni
  const isAlumni = () => {
    return state.user?.role === 'alumni';
  };

  // Check if user is student
  const isStudent = () => {
    return state.user?.role === 'student';
  };

  // Check if user is verified
  const isVerified = () => {
    return state.user?.isVerified;
  };

  // Check if user is approved (for alumni)
  const isApproved = () => {
    return state.user?.isApproved;
  };

  // Check if user can access feature
  const canAccess = (feature) => {
    if (!state.user) return false;
    
    switch (feature) {
      case 'mentorship':
        return state.user.role === 'student' || 
               (state.user.role === 'alumni' && state.user.isApproved);
      
      case 'post-jobs':
        return state.user.role === 'alumni' || state.user.role === 'admin';
      
      case 'create-events':
        return state.user.role === 'alumni' || state.user.role === 'admin';
      
      case 'create-contests':
        return state.user.role === 'alumni' || state.user.role === 'admin';
      
      case 'moderate':
        return state.user.role === 'admin' || 
               (state.user.role === 'alumni' && state.user.isApproved);
      
      case 'admin':
        return state.user.role === 'admin';
      
      default:
        return true;
    }
  };

  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    loginWithGoogle,
    loginWithGithub,
    register,
    logout,
    updateUser,
    clearError,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    
    // Utility functions
    isAdmin,
    isAlumni,
    isStudent,
    isVerified,
    isApproved,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuthUtils } from '../hooks/useAuthUtils';

// Create context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: null,
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
  const authUtils = useAuthUtils(state.user);

  // Sync token to localStorage - removed for security (using HTTP-only cookies)
  useEffect(() => {
    // No-op: cookies are handled by browser
  }, [state.token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const controller = new AbortController();

    const checkAuth = async () => {
      try {
        // Always try to fetch profile; cookie will be sent automatically
        const response = await api.get('/auth/me', {
          signal: controller.signal
        });
        if (!controller.signal.aborted) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: response.data.user, token: state.token || 'cookie_auth' }
          });
        }
      } catch (error) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') return;
        console.error('Auth check failed:', error);
        
        // If 401/403, clear state
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        } else {
          // Other errors (network), just stop loading but don't log out explicitly
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
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

      const { user, token, requires2FA, availableMethods, methodSent, message } = response.data;
      
      if (requires2FA) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        if(methodSent) toast.success(message || 'OTP sent successfully!');
        return { success: true, requires2FA: true, email, availableMethods, methodSent };
      }
      
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

      const { user, token, isNewUser, requiresRoleSelection, tempToken, requires2FA, availableMethods, methodSent, message } = response.data;
      
      if (requiresRoleSelection) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return { success: true, requiresRoleSelection: true, tempToken };
      }

      if (requires2FA) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        if(methodSent) toast.success(message || 'OTP sent successfully!');
        return { success: true, requires2FA: true, email: user?.email, availableMethods, methodSent };
      }
      
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
        code,
        clientId: process.env.REACT_APP_GITHUB_CLIENT_ID
      });

      const { user, token, isNewUser, requiresRoleSelection, tempToken, requires2FA, availableMethods, methodSent, message } = response.data;
      
      if (requiresRoleSelection) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return { success: true, requiresRoleSelection: true, tempToken };
      }

      if (requires2FA) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        if(methodSent) toast.success(message || 'OTP sent successfully!');
        return { success: true, requires2FA: true, email: user?.email, availableMethods, methodSent };
      }
      
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

  // Complete OAuth login with selected role
  const completeOAuthLogin = async (tempToken, role) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await api.post('/auth/oauth-complete', {
        tempToken,
        role
      });

      const { user, token, message } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });

      toast.success(message || 'Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to complete registration';
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
      let message = error.response?.data?.message;
      
      if (error.response?.status === 429) {
        message = 'Too many attempts. Please try again later.';
      } else if (!message && error.response?.data?.errors && error.response.data.errors.length > 0) {
        const firstError = error.response.data.errors[0];
        const fieldName = firstError.path || firstError.param || 'Field';
        message = `${fieldName}: ${firstError.msg || firstError.message || 'Invalid value'}`;
      }
      message = message || 'Registration failed';
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    toast.success('Logged out successfully');
  };

  // Set auth user directly (used by ProfileContext)
  const setAuthUser = (user) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: user
    });
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

  // Send 2FA
  const send2FA = async (email, method) => {
    try {
      const response = await api.post('/auth/send-2fa', { email, method });
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Verify 2FA
  const verify2FA = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-2fa', { email, otp });
      const { user, token, message } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });
      
      toast.success(message || 'Login successful');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '2FA Verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Note: Utility functions (isAdmin, isAlumni, etc.) extracted to useAuthUtils

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
    completeOAuthLogin,
    register,
    logout,
    setAuthUser,
    clearError,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    send2FA,
    verify2FA,
    
    // Utility functions
    ...authUtils
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

import api from '../utils/api';
import toast from 'react-hot-toast';

export const AUTH_ACTIONS = {
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

export const useAuthActions = (dispatch) => {
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await api.post('/auth/login', { email, password });
      const { user, token, requires2FA, availableMethods, methodSent, message } = response.data;
      
      if (requires2FA) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        if(methodSent) toast.success(message || 'OTP sent successfully!');
        return { success: true, requires2FA: true, email, availableMethods, methodSent };
      }
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const requiresVerification = error.response?.data?.requiresVerification;
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: message });
      if (!requiresVerification) toast.error(message);
      return { success: false, error: message, requiresVerification, email: error.response?.data?.email || email };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await api.post('/auth/google', { credential });
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
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });
      toast.success(message || 'Google Login successful!');
      return { success: true, isNewUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Google Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const loginWithGithub = async (code) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await api.post('/auth/github', { code, clientId: process.env.REACT_APP_GITHUB_CLIENT_ID });
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
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });
      toast.success(message || 'GitHub Login successful!');
      return { success: true, isNewUser };
    } catch (error) {
      const message = error.response?.data?.message || 'GitHub Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const completeOAuthLogin = async (tempToken, role) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await api.post('/auth/oauth-complete', { tempToken, role });
      const { user, token, message } = response.data;
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });
      toast.success(message || 'Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to complete registration';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

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
      
      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS, payload: { user, token } });
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
      
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    toast.success('Logged out successfully');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

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

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-email', { email, otp });
      const { user, token, message } = response.data;
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });
      toast.success(message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

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

  const verify2FA = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-2fa', { email, otp });
      const { user, token, message } = response.data;
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });
      toast.success(message || 'Login successful');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '2FA Verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const setAuthUser = (user) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  return {
    login,
    loginWithGoogle,
    loginWithGithub,
    completeOAuthLogin,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    send2FA,
    verify2FA,
    setAuthUser,
    clearError
  };
};

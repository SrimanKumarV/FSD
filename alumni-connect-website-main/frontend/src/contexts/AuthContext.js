import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';
import { useAuthUtils } from '../hooks/useAuthUtils';
import { useAuthActions, AUTH_ACTIONS } from '../hooks/useAuthActions';

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

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return { ...state, isLoading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true, isLoading: false, error: null };
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false, error: action.payload };
    case AUTH_ACTIONS.LOGOUT:
      return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false, error: null };
    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: action.payload };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authUtils = useAuthUtils(state.user);
  const authActions = useAuthActions(dispatch);

  // Check if user is authenticated on mount
  useEffect(() => {
    const controller = new AbortController();

    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me', { signal: controller.signal });
        if (!controller.signal.aborted) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: response.data.user, token: state.token || 'cookie_auth' }
          });
        }
      } catch (error) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') return;
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      }
    };

    checkAuth();

    const handleForceLogout = () => {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };
    window.addEventListener('auth:logout', handleForceLogout);

    return () => {
      controller.abort();
      window.removeEventListener('auth:logout', handleForceLogout);
    };
  }, []);

  const value = {
    // State
    ...state,
    
    // Actions
    ...authActions,
    
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

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api, { mobileTokenStore } from '../utils/api';
import { useAuthUtils } from '../hooks/useAuthUtils';
import { useAuthActions, AUTH_ACTIONS } from '../hooks/useAuthActions';

// Create context
const AuthContext = createContext();

// Helper to retrieve saved user safely from localStorage
const getSavedUser = () => {
  try {
    const raw = localStorage.getItem('alumnex_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const savedUser = getSavedUser();
const savedToken = mobileTokenStore.get();

// Initial state
const initialState = {
  user: savedUser,
  token: savedToken,
  isAuthenticated: Boolean(savedUser && savedToken),
  isLoading: Boolean(savedToken || savedUser),
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
      mobileTokenStore.set(action.payload.token);
      if (action.payload.user) {
        try {
          localStorage.setItem('alumnex_auth_user', JSON.stringify(action.payload.user));
        } catch (e) { }
      }
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true, isLoading: false, error: null };
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false, error: action.payload };
    case AUTH_ACTIONS.LOGOUT:
      mobileTokenStore.clear();
      try {
        localStorage.removeItem('alumnex_auth_user');
      } catch (e) { }
      return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false, error: null };
    case AUTH_ACTIONS.UPDATE_USER:
      if (action.payload) {
        try {
          localStorage.setItem('alumnex_auth_user', JSON.stringify(action.payload));
        } catch (e) { }
      }
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
      const currentStoredToken = mobileTokenStore.get();
      const currentStoredUser = getSavedUser();

      // If absolutely no credentials exist, finish loading immediately
      if (!currentStoredToken && !currentStoredUser) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const response = await api.get('/auth/me', { signal: controller.signal });
        if (!controller.signal.aborted) {
          const verifiedToken = mobileTokenStore.get() || response.data?.token || currentStoredToken;
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: response.data.user, token: verifiedToken }
          });
        }
      } catch (error) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') return;

        // If 401 or 403 reached here, api.js already attempted silent refresh and failed
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        } else {
          // Cold-start, network drop, timeout: keep cached user session alive!
          console.warn('[AuthContext] Backend check encountered network error, keeping cached session:', error.message);
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

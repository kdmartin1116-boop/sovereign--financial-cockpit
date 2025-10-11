import React, { createContext, useContext, useReducer } from 'react';

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  ADD_DOCUMENT: 'ADD_DOCUMENT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  documents: [],
  profile: {
    name: '',
    address: '',
    email: '',
    phone: ''
  },
  notifications: []
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        error: null
      };
    
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case ActionTypes.SET_DOCUMENTS:
      return {
        ...state,
        documents: action.payload
      };
    
    case ActionTypes.ADD_DOCUMENT:
      return {
        ...state,
        documents: [...state.documents, action.payload]
      };
    
    case ActionTypes.UPDATE_PROFILE:
      return {
        ...state,
        profile: { ...state.profile, ...action.payload }
      };
    
    case ActionTypes.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload
      };
    
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          ...action.payload,
          id: Date.now(),
          timestamp: new Date().toISOString()
        }]
      };
    
    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    setUser: (user) => {
      dispatch({ type: ActionTypes.SET_USER, payload: user });
    },

    setLoading: (loading) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
    },

    setError: (error) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
    },

    setDocuments: (documents) => {
      dispatch({ type: ActionTypes.SET_DOCUMENTS, payload: documents });
    },

    addDocument: (document) => {
      dispatch({ type: ActionTypes.ADD_DOCUMENT, payload: document });
    },

    updateProfile: (profileData) => {
      dispatch({ type: ActionTypes.UPDATE_PROFILE, payload: profileData });
    },

    addNotification: (notification) => {
      dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: notification });
    },

    removeNotification: (notificationId) => {
      dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: notificationId });
    },

    // Utility functions
    showSuccess: (message) => {
      dispatch({
        type: ActionTypes.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          message,
          duration: 5000
        }
      });
    },

    showError: (message) => {
      dispatch({
        type: ActionTypes.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message,
          duration: 0 // Don't auto-remove error notifications
        }
      });
    },

    showWarning: (message) => {
      dispatch({
        type: ActionTypes.ADD_NOTIFICATION,
        payload: {
          type: 'warning',
          message,
          duration: 7000
        }
      });
    },

    showInfo: (message) => {
      dispatch({
        type: ActionTypes.ADD_NOTIFICATION,
        payload: {
          type: 'info',
          message,
          duration: 5000
        }
      });
    }
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Selectors for easy state access
export const useAuth = () => {
  const { state } = useApp();
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading
  };
};

export const useDocuments = () => {
  const { state, actions } = useApp();
  return {
    documents: state.documents,
    addDocument: actions.addDocument,
    setDocuments: actions.setDocuments
  };
};

export const useProfile = () => {
  const { state, actions } = useApp();
  return {
    profile: state.profile,
    updateProfile: actions.updateProfile
  };
};

export const useNotifications = () => {
  const { state, actions } = useApp();
  return {
    notifications: state.notifications,
    showSuccess: actions.showSuccess,
    showError: actions.showError,
    showWarning: actions.showWarning,
    showInfo: actions.showInfo,
    removeNotification: actions.removeNotification
  };
};

export default AppContext;
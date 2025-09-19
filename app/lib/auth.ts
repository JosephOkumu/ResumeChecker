import { create } from "zustand";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

interface AuthStore {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    signInWithGoogle: (googleToken: string) => Promise<void>;
    signOut: () => void;
    checkAuthStatus: () => Promise<void>;
    clearError: () => void;
}

// Create axios instance with interceptors
const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            useAuthStore.getState().signOut();
        }
        return Promise.reject(error);
    }
);

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    signInWithGoogle: async (googleToken: string) => {
        set({ isLoading: true, error: null });
        
        try {
            const response = await api.post('/auth/google', { token: googleToken });
            const { token, user } = response.data;
            
            // Store in localStorage
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));
            
            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Authentication failed';
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: errorMessage
            });
            throw new Error(errorMessage);
        }
    },

    signOut: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
        });
    },

    checkAuthStatus: async () => {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (!token || !userData) {
            set({ isAuthenticated: false, isLoading: false });
            return;
        }
        
        set({ isLoading: true });
        
        try {
            // Verify token with backend
            const response = await api.get('/auth/me');
            const user = response.data.user;
            
            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });
        } catch (error) {
            // Token is invalid
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        }
    },

    clearError: () => {
        set({ error: null });
    }
}));

// Export the configured axios instance for use in other parts of the app
export { api };

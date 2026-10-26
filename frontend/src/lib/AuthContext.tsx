// frontend/src/lib/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  institution_id?: string | null;
  region_id?: string | null;
  account_status: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const response = await axios.get<UserProfile>('/api/v1/auth/me', {
        withCredentials: true,
      });
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = (token: string, userProfile: UserProfile) => {
    // Set memory-token fallback if Authorization header is used outside cookies
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userProfile);
  };

  const logout = async () => {
    try {
      await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
    } finally {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refetchUser: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be utilized within an AuthProvider hierarchy.');
  }
  return context;
};
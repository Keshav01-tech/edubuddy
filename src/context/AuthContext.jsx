import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check configuration status dynamically
    const configured = isSupabaseConfigured();
    
    if (!configured) {
      setIsDemoMode(true);
      const savedUser = localStorage.getItem('edu_demo_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    setIsDemoMode(false);
    
    // Retrieve initial session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('Supabase getSession error, entering fallback demo mode:', err);
      setIsDemoMode(true);
      setLoading(false);
    });

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Login handler
  const signIn = async (email, password) => {
    if (isDemoMode) {
      const mockUser = {
        id: 'demo-student-uuid',
        email: email,
        user_metadata: { full_name: 'Demo Student' },
        email_confirmed_at: new Date().toISOString()
      };
      setUser(mockUser);
      localStorage.setItem('edu_demo_user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    }
    
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      return result;
    } catch (err) {
      return { data: null, error: err };
    }
  };

  // Sign up handler
  const signUp = async (email, password, fullName) => {
    if (isDemoMode) {
      const mockUser = {
        id: 'demo-student-uuid',
        email: email,
        user_metadata: { full_name: fullName || 'Demo Student' },
        email_confirmed_at: new Date().toISOString()
      };
      setUser(mockUser);
      localStorage.setItem('edu_demo_user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    }
    
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      return result;
    } catch (err) {
      return { data: null, error: err };
    }
  };

  // Sign out handler
  const signOut = async () => {
    if (isDemoMode) {
      setUser(null);
      localStorage.removeItem('edu_demo_user');
      return { error: null };
    }
    
    try {
      const result = await supabase.auth.signOut();
      setUser(null);
      return result;
    } catch (err) {
      setUser(null);
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

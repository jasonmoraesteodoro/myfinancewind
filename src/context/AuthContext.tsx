import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        
        // Check if Supabase is properly configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase_project_url_here') || supabaseKey.includes('your_supabase_anon_key_here')) {
          console.warn('⚠️ Supabase not configured - using offline mode');
          console.warn('⚠️ Please update your .env file with actual Supabase credentials');
          console.warn('⚠️ Get credentials from: Supabase Dashboard > Project Settings > API');
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Set a shorter timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⚠️ Tempo limite na inicialização da autenticação - conexão com Supabase demorou mais que o esperado. Prosseguindo sem sessão.');
            alert('A conexão com o Supabase está lenta ou indisponível. Algumas funcionalidades podem não estar disponíveis.');
          }
        }, 8000); // 8 segundos de timeout geral
        
        // Get initial session with shorter timeout
        try {
          const controller = new AbortController();
          const sessionTimeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos para o getSession
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          clearTimeout(sessionTimeoutId);
          clearTimeout(timeoutId); // Limpa timeout geral assim que getSession responde

          if (error) {
            console.warn('⚠️ Session error:', error.message);
            if (mounted) {
              clearTimeout(timeoutId);
              setLoading(false);
            }
            return;
          }

          if (session?.user && mounted) {
            console.log('✅ Found existing session');
            await loadUserProfile(session.user);
          } else {
            console.log('🔐 No existing session found');
          }
        } catch (sessionError) {
          if (sessionError instanceof Error && (sessionError.name === 'AbortError' || sessionError.message.includes('abort'))) {
            console.warn('⚠️ Session check timed out - proceeding without session');
          } else {
            console.warn('⚠️ Session check failed:', sessionError);
          }
        }

        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (error) {
        console.warn('⚠️ Auth initialization error:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔐 Auth state change:', event);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        console.log('🔐 No session, clearing user data');
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('👤 Loading user profile for:', supabaseUser.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading user profile:', error);
        // Continue with basic user data even if profile fails
      }

      const userData: User = {
        id: supabaseUser.id,
        name: profile?.name || supabaseUser.user_metadata?.name || 'Usuário',
        email: supabaseUser.email || '',
        avatar: profile?.avatar_url || undefined,
      };

      console.log('✅ User profile loaded:', userData.name);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      // Set basic user data even if profile loading fails
      const userData: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || 'Usuário',
        email: supabaseUser.email || '',
      };
      setUser(userData);
      setIsAuthenticated(true);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        return false;
      }

      if (data.user) {
        console.log('✅ Login successful');
        await loadUserProfile(data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      console.log('📝 Attempting registration...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (error) {
        console.error('❌ Registration error:', error);
        return false;
      }

      if (data.user) {
        console.log('✅ Registration successful');
        // Try to update profile, but don't fail if it doesn't work
        try {
          await supabase
            .from('profiles')
            .update({ name })
            .eq('id', data.user.id);
        } catch (profileError) {
          console.warn('⚠️ Profile update failed, but registration succeeded');
        }

        await loadUserProfile(data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('🔓 Logout function called');
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const updateUserProfile = async (updatedUser: Partial<User>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updatedUser.name,
          avatar_url: updatedUser.avatar,
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Profile update error:', error);
        return;
      }

      setUser({ ...user, ...updatedUser });
    } catch (error) {
      console.error('❌ Profile update error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    updateUserProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
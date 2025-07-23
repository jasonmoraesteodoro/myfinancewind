import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔧 Supabase Config Check:');
console.log('URL exists:', !!supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);
console.log('URL:', supabaseUrl.includes('your_supabase_project_url_here') ? 'PLACEHOLDER - Update with real URL' : (supabaseUrl || 'MISSING'));
console.log('Key:', supabaseAnonKey.includes('your_supabase_anon_key_here') ? 'PLACEHOLDER - Update with real key' : (supabaseAnonKey ? 'Set' : 'MISSING'));

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url_here') || supabaseAnonKey.includes('your_supabase_anon_key_here')) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!');
  console.error('You need to update the .env file with your actual Supabase credentials:');
  console.error('- VITE_SUPABASE_URL: Your Supabase project URL');
  console.error('- VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key');
  console.error('- Get these values from your Supabase project settings > API');
  
  // Show user-friendly error in production
  if (import.meta.env.PROD) {
    console.error('🚨 PRODUCTION ERROR: Cannot connect to database without environment variables');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  }
);

// Test connection
const testConnection = async () => {
  // Skip connection test if using placeholder values
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url_here') || supabaseAnonKey.includes('your_supabase_anon_key_here')) {
    console.warn('⚠️ Skipping connection test - Supabase not configured');
    console.warn('⚠️ Please update your .env file with real Supabase credentials');
    console.warn('⚠️ Get your credentials from: Supabase Dashboard > Project Settings > API');
    return;
  }

  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Simple connection test with shorter timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      if (error.message.includes('abort')) {
        console.warn('⚠️ Supabase connection test timed out (this is normal if not configured)');
      } else {
        console.error('❌ Supabase connection test failed:', error.message);
        console.error('❌ This usually means invalid credentials or network issues');
      }
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('abort')) {
        console.warn('⚠️ Supabase connection test timed out (this is normal if not configured)');
      } else {
        console.warn('⚠️ Supabase connection test failed:', error.message);
        console.warn('⚠️ This is normal if Supabase is not configured yet');
      }
    } else {
      console.warn('⚠️ Supabase connection test failed with unknown error');
    }
  }
};

// Only test connection in browser environment
if (typeof window !== 'undefined') {
  testConnection();
}

// Types for database tables
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'income' | 'expense';
          created_at?: string;
        };
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'income' | 'expense';
          amount: number;
          description: string | null;
          category_id: string | null;
          subcategory_id: string | null;
          date: string;
          status: 'paid' | 'pending';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'income' | 'expense';
          amount: number;
          description?: string | null;
          category_id?: string | null;
          subcategory_id?: string | null;
          date: string;
          status?: 'paid' | 'pending';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'income' | 'expense';
          amount?: number;
          description?: string | null;
          category_id?: string | null;
          subcategory_id?: string | null;
          date?: string;
          status?: 'paid' | 'pending';
          created_at?: string;
        };
      };
    };
  };
}
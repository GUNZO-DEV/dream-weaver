import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
 import { Capacitor } from '@capacitor/core';
 import { supabase } from '@/integrations/supabase/client';
 import { nativeSupabase } from '@/lib/supabaseClient';
 
 // Use native-compatible client on iOS/Android, standard client on web
 const getClient = () => {
   const isNative = Capacitor.isNativePlatform();
   console.log('[AuthContext] getClient - isNative:', isNative, 'platform:', Capacitor.getPlatform());
   return isNative ? nativeSupabase : supabase;
 };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
     const client = getClient();
    console.log('[AuthContext] Initializing auth...');

    // Listener for ONGOING auth changes (does NOT control loading)
     const { data: { subscription } } = client.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        console.log('[AuthContext] Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // INITIAL load (controls loading state)
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Getting initial session...');
         const { data: { session } } = await client.auth.getSession();
        if (!isMounted) return;
        
        console.log('[AuthContext] Initial session:', session?.user?.id ?? 'none');
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('[AuthContext] Error getting session:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
     const client = getClient();
     const { error } = await client.auth.signUp({
      email,
      password,
      options: {
         emailRedirectTo: Capacitor.isNativePlatform() ? undefined : window.location.origin,
        data: { display_name: displayName },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] Signing in:', email);
     const client = getClient();
     const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('[AuthContext] Sign in error:', error);
    } else {
      console.log('[AuthContext] Sign in successful');
    }
    return { error };
  };

  const signOut = async () => {
     const client = getClient();
     await client.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | null;
  onboarded: boolean;
}

function extractProfile(user: User | null): UserProfile {
  const meta = user?.user_metadata ?? {};
  return {
    firstName: meta.first_name || meta.full_name?.split(' ')[0] || '',
    lastName: meta.last_name || meta.full_name?.split(' ').slice(1).join(' ') || '',
    role: meta.role || null,
    onboarded: !!meta.onboarded,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    role: null,
    onboarded: false,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setProfile(extractProfile(session?.user ?? null));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setProfile(extractProfile(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  const signUpWithPassword = useCallback(
    async (
      email: string,
      password: string,
      meta: { firstName: string; lastName: string; role: string },
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: meta.firstName,
            last_name: meta.lastName,
            role: meta.role,
          },
        },
      });
      if (error) throw error;
    },
    [],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    [],
  );

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      const meta: Record<string, string | boolean> = {};
      if (data.firstName !== undefined) meta.first_name = data.firstName;
      if (data.lastName !== undefined) meta.last_name = data.lastName;
      if (data.role !== undefined && data.role) meta.role = data.role;
      if (data.onboarded !== undefined) meta.onboarded = data.onboarded;

      const { error } = await supabase.auth.updateUser({ data: meta });
      if (error) throw error;
      setProfile((prev) => ({ ...prev, ...data }));
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return {
    user,
    session,
    loading,
    profile,
    signInWithGoogle,
    signInWithEmail,
    signUpWithPassword,
    signInWithPassword,
    updateProfile,
    signOut,
  };
}

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isDemoMode } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      // Demo mode: Check localStorage for user session
      const savedUser = localStorage.getItem("demo_user");
      const savedToken = localStorage.getItem("token");

      if (savedUser && savedToken) {
        try {
          const userData = JSON.parse(savedUser);
          setUser({
            id: userData.id,
            email: userData.email,
            user_metadata: { name: userData.name },
          } as User);
        } catch (error) {
          localStorage.removeItem("demo_user");
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
      return;
    }

    // Supabase mode: Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.warn('Supabase auth session error (falling back to demo mode):', error);
        setLoading(false);
      });

    // Listen for auth changes with error handling
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.warn('Supabase auth listener error (falling back to demo mode):', error);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (isDemoMode) {
        // Demo mode: Simple email/password check
        const demoUsers = JSON.parse(
          localStorage.getItem("demo_users") || "[]",
        );
        const foundUser = demoUsers.find(
          (u: any) => u.email === email && u.password === password,
        );

        if (!foundUser) {
          return { error: new Error("Invalid email or password") };
        }

        // Set user session
        const userData = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
        };
        localStorage.setItem("demo_user", JSON.stringify(userData));
        localStorage.setItem("token", `demo_token_${foundUser.id}`);

        setUser({
          id: foundUser.id,
          email: foundUser.email,
          user_metadata: { name: foundUser.name },
        } as User);

        return { error: undefined };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: undefined };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      if (isDemoMode) {
        // Demo mode: Store user in localStorage
        const demoUsers = JSON.parse(
          localStorage.getItem("demo_users") || "[]",
        );

        // Check if user already exists
        if (demoUsers.find((u: any) => u.email === email)) {
          return { error: new Error("User already exists") };
        }

        const newUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          password, // In real app, this would be hashed
          name,
          created_at: new Date().toISOString(),
        };

        demoUsers.push(newUser);
        localStorage.setItem("demo_users", JSON.stringify(demoUsers));

        // Set user session
        const userData = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        };
        localStorage.setItem("demo_user", JSON.stringify(userData));
        localStorage.setItem("token", `demo_token_${newUser.id}`);

        setUser({
          id: newUser.id,
          email: newUser.email,
          user_metadata: { name: newUser.name },
        } as User);

        return { error: undefined };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return { error };
      }

      return { error: undefined };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem("demo_user");
      localStorage.removeItem("token");
      setUser(null);
      return;
    }

    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

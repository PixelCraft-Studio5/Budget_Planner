import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  recoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  finishPasswordRecovery: () => void;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

function toAuthUser(user: User | null): AuthUser | null {
  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name:
      typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : user.email,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(() =>
    window.location.hash.includes("type=recovery")
  );

  useEffect(() => {
    let isMounted = true;
    let receivedAuthEvent = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      receivedAuthEvent = true;

      if (isMounted) {
        setUser(toAuthUser(session?.user ?? null));
        setIsLoading(false);
        setError(null);
        if (event === "PASSWORD_RECOVERY") {
          setRecoveryMode(true);
        }
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted || receivedAuthEvent) {
          return;
        }

        if (sessionError) {
          throw sessionError;
        }

        setUser(toAuthUser(data.session?.user ?? null));
        setError(null);
      })
      .catch((sessionError: unknown) => {
        if (isMounted && !receivedAuthEvent) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Could not connect to Supabase."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    name: string,
    email: string,
    password: string
  ) => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: window.location.origin,
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    return data.session !== null;
  };

  const signIn = async (email: string, password: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      throw signInError;
    }
  };

  const requestPasswordReset = async (email: string) => {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: window.location.origin }
    );

    if (resetError) {
      throw resetError;
    }
  };

  const updatePassword = async (password: string) => {
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      throw updateError;
    }
  };

  const finishPasswordRecovery = () => {
    setRecoveryMode(false);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      throw signOutError;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        recoveryMode,
        signIn,
        signUp,
        requestPasswordReset,
        updatePassword,
        finishPasswordRecovery,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}

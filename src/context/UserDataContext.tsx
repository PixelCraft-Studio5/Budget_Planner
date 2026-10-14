import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Budget, Expense } from "../types/budget";
import { getAccountStorageKey } from "../utils/accountStorage";
import type { AuthUser } from "./AuthContext";
import { supabase } from "../lib/supabase";

export interface Profile {
  name: string;
  email: string;
  currency: string;
  monthlyBudget: number;
  notifications: boolean;
  darkMode: boolean;
}

interface UserDataContextType {
  budget: Budget;
  profile: Profile;
  status: "loading" | "ready" | "error";
  loadError: string | null;
  syncError: string | null;
  retryLoad: () => void;
  updateBudget: (updates: Partial<Budget>) => void;
  saveBudget: () => Promise<void>;
  resetBudget: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
  saveProfile: () => Promise<void>;
  resetProfile: () => Promise<void>;
}

interface UserDataProviderProps {
  user: AuthUser;
  children: ReactNode;
}

const defaultBudget: Budget = {
  workIncome: 0,
  sideHustleIncome: 0,
  savingTarget: 0,
  emergencyFund: 0,
  expenses: [],
};

const STORAGE_KEY = "budget-planner-budget";
const PROFILE_STORAGE_KEY = "budget-planner-profile";

const UserDataContext =
  createContext<UserDataContextType | undefined>(undefined);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseLocalValue(key: string): unknown {
  const value = localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    console.error(`Failed to read local data for "${key}":`, error);
    return null;
  }
}

function normalizeBudget(value: unknown): Budget {
  if (!isRecord(value)) {
    return { ...defaultBudget, expenses: [] };
  }

  const expenses: Expense[] = Array.isArray(value.expenses)
    ? value.expenses.filter(
        (expense): expense is Expense =>
          isRecord(expense) &&
          typeof expense.id === "string" &&
          typeof expense.name === "string" &&
          typeof expense.amount === "number" &&
          (expense.type === "fixed" || expense.type === "variable")
      )
    : [];

  return {
    workIncome:
      typeof value.workIncome === "number" ? value.workIncome : 0,
    sideHustleIncome:
      typeof value.sideHustleIncome === "number"
        ? value.sideHustleIncome
        : 0,
    savingTarget:
      typeof value.savingTarget === "number" ? value.savingTarget : 0,
    emergencyFund:
      typeof value.emergencyFund === "number" ? value.emergencyFund : 0,
    expenses,
  };
}

function defaultProfile(userName: string, email: string): Profile {
  return {
    name: userName,
    email,
    currency: "ZAR",
    monthlyBudget: 0,
    notifications: true,
    darkMode: false,
  };
}

function normalizeProfile(
  value: unknown,
  userName: string,
  email: string
): Profile {
  const fallback = defaultProfile(userName, email);

  if (!isRecord(value)) {
    return fallback;
  }

  return {
    name: typeof value.name === "string" ? value.name : fallback.name,
    email: typeof value.email === "string" ? value.email : fallback.email,
    currency:
      typeof value.currency === "string"
        ? value.currency
        : fallback.currency,
    monthlyBudget:
      typeof value.monthlyBudget === "number"
        ? value.monthlyBudget
        : fallback.monthlyBudget,
    notifications:
      typeof value.notifications === "boolean"
        ? value.notifications
        : fallback.notifications,
    darkMode:
      typeof value.darkMode === "boolean"
        ? value.darkMode
        : fallback.darkMode,
  };
}

export function UserDataProvider({
  user,
  children,
}: UserDataProviderProps) {
  const [budget, setBudget] = useState<Budget>(defaultBudget);
  const [profile, setProfile] = useState<Profile>(() =>
    defaultProfile(user.name, user.email)
  );
  const profileRef = useRef(profile);
  const profileWriteRef = useRef<Promise<void>>(Promise.resolve());
  const [status, setStatus] =
    useState<UserDataContextType["status"]>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("user_data")
        .select("budget, profile")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const localBudgetKey = getAccountStorageKey(STORAGE_KEY, user.email);
      const localProfileKey = getAccountStorageKey(
        PROFILE_STORAGE_KEY,
        user.email
      );

      if (data) {
        const nextBudget = normalizeBudget(data.budget);
        const nextProfile = normalizeProfile(
          data.profile,
          user.name,
          user.email
        );

        if (isMounted) {
          setBudget(nextBudget);
          profileRef.current = nextProfile;
          setProfile(nextProfile);
          setStatus("ready");
        }

        return;
      }

      const legacyBudget = parseLocalValue(localBudgetKey);
      const accountProfile = parseLocalValue(localProfileKey);
      const oldProfile = parseLocalValue(PROFILE_STORAGE_KEY);
      const legacyProfile =
        accountProfile ??
        (isRecord(oldProfile) &&
        typeof oldProfile.email === "string" &&
        oldProfile.email.toLowerCase() === user.email.toLowerCase()
          ? oldProfile
          : null);
      const nextBudget = normalizeBudget(legacyBudget);
      const nextProfile = normalizeProfile(
        legacyProfile,
        user.name,
        user.email
      );

      if (legacyBudget !== null || legacyProfile !== null) {
        const { error: migrationError } = await supabase
          .from("user_data")
          .upsert({
            user_id: user.id,
            budget: nextBudget,
            profile: nextProfile,
          });

        if (migrationError) {
          throw migrationError;
        }

        localStorage.removeItem(localBudgetKey);
        localStorage.removeItem(localProfileKey);
      }

      if (isMounted) {
        setBudget(nextBudget);
        profileRef.current = nextProfile;
        setProfile(nextProfile);
        setStatus("ready");
      }
    };

    void load().catch((error: unknown) => {
      if (isMounted) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load your data from Supabase."
        );
        setStatus("error");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadAttempt, user.email, user.id, user.name]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setStatus("loading");
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  const updateBudget = (updates: Partial<Budget>) => {
    setBudget((currentBudget) => ({ ...currentBudget, ...updates }));
  };

  const saveBudget = async () => {
    const { error } = await supabase.from("user_data").upsert({
      user_id: user.id,
      budget,
    });

    if (error) {
      setSyncError(error.message);
      throw error;
    }

    setSyncError(null);
  };

  const resetBudget = async () => {
    const { error } = await supabase.from("user_data").upsert({
      user_id: user.id,
      budget: defaultBudget,
    });

    if (error) {
      setSyncError(error.message);
      throw error;
    }

    setBudget({ ...defaultBudget, expenses: [] });
    setSyncError(null);
  };

  const queueProfileWrite = (nextProfile: Profile) => {
    const write = profileWriteRef.current
      .catch(() => undefined)
      .then(async () => {
        const { error } = await supabase.from("user_data").upsert({
          user_id: user.id,
          profile: nextProfile,
        });

        if (error) {
          throw error;
        }

        setSyncError(null);
      });

    profileWriteRef.current = write;
    void write.catch((error: unknown) => {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Could not save your profile to Supabase."
      );
    });

    return write;
  };

  const updateProfile = (updates: Partial<Profile>) => {
    const nextProfile = { ...profileRef.current, ...updates };
    profileRef.current = nextProfile;
    setProfile(nextProfile);
    void queueProfileWrite(nextProfile);
  };

  const saveProfile = async () => {
    await profileWriteRef.current.catch(() => undefined);
    const { error } = await supabase.from("user_data").upsert({
      user_id: user.id,
      profile: profileRef.current,
    });

    if (error) {
      setSyncError(error.message);
      throw error;
    }

    setSyncError(null);
  };

  const resetProfile = async () => {
    const nextProfile = defaultProfile(user.name, user.email);
    profileRef.current = nextProfile;
    setProfile(nextProfile);
    document.body.classList.remove("dark-mode");
    await queueProfileWrite(nextProfile);
  };

  return (
    <UserDataContext.Provider
      value={{
        budget,
        profile,
        status,
        loadError,
        syncError,
        retryLoad,
        updateBudget,
        saveBudget,
        resetBudget,
        updateProfile,
        saveProfile,
        resetProfile,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);

  if (!context) {
    throw new Error("useUserData must be used inside a UserDataProvider");
  }

  return context;
}

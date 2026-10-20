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
  isOnline: boolean;
  hasPendingSync: boolean;
  retryLoad: () => void;
  updateBudget: (updates: Partial<Budget>) => void;
  saveBudget: () => Promise<"synced" | "offline" | "queued">;
  resetBudget: () => Promise<"synced" | "offline" | "queued">;
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
const CACHE_STORAGE_KEY = "budget-planner-offline-cache";

interface CachedUserData {
  budget: Budget;
  profile: Profile;
  pendingSync: boolean;
}

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

function readCachedUserData(
  key: string,
  userName: string,
  email: string
): CachedUserData | null {
  const value = parseLocalValue(key);

  if (!isRecord(value) || !isRecord(value.budget)) {
    return null;
  }

  return {
    budget: normalizeBudget(value.budget),
    profile: normalizeProfile(value.profile, userName, email),
    pendingSync: value.pendingSync === true,
  };
}

function writeCachedUserData(
  key: string,
  budget: Budget,
  profile: Profile,
  pendingSync: boolean
) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ budget, profile, pendingSync })
    );
  } catch (error) {
    console.error("Could not save budget data on this device:", error);
    throw new Error(
      "Could not save your budget on this device. Check available storage and try again."
    );
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
  const budgetRef = useRef(budget);
  const profileRef = useRef(profile);
  const profileWriteRef = useRef<Promise<void>>(Promise.resolve());
  const pendingSyncRef = useRef(false);
  const syncInProgressRef = useRef(false);
  const [status, setStatus] =
    useState<UserDataContextType["status"]>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const cacheKey = getAccountStorageKey(CACHE_STORAGE_KEY, user.email);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (status === "ready") {
      document.body.classList.toggle("dark-mode", profile.darkMode);
    }
  }, [profile.darkMode, status]);

  useEffect(
    () => () => {
      document.body.classList.remove("dark-mode");
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const localBudgetKey = getAccountStorageKey(STORAGE_KEY, user.email);
      const localProfileKey = getAccountStorageKey(
        PROFILE_STORAGE_KEY,
        user.email
      );
      const cachedData = readCachedUserData(
        cacheKey,
        user.name,
        user.email
      );
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
      const legacyDataExists =
        legacyBudget !== null || legacyProfile !== null;
      const legacyNextBudget = normalizeBudget(legacyBudget);
      const legacyNextProfile = normalizeProfile(
        legacyProfile,
        user.name,
        user.email
      );

      const applyData = (
        nextBudget: Budget,
        nextProfile: Profile,
        pendingSync: boolean
      ) => {
        if (!isMounted) {
          return;
        }

        budgetRef.current = nextBudget;
        setBudget(nextBudget);
        profileRef.current = nextProfile;
        setProfile(nextProfile);
        pendingSyncRef.current = pendingSync;
        setHasPendingSync(pendingSync);
        setStatus("ready");

        try {
          writeCachedUserData(
            cacheKey,
            nextBudget,
            nextProfile,
            pendingSync
          );
        } catch (cacheError) {
          setSyncError(
            cacheError instanceof Error
              ? cacheError.message
              : "Could not save your data on this device."
          );
        }
      };

      try {
        const { data, error } = await supabase
          .from("user_data")
          .select("budget, profile")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (cachedData?.pendingSync) {
          applyData(
            cachedData.budget,
            cachedData.profile,
            true
          );
          return;
        }

        if (data) {
          applyData(
            normalizeBudget(data.budget),
            normalizeProfile(data.profile, user.name, user.email),
            false
          );
          return;
        }

        if (legacyDataExists) {
          const { error: migrationError } = await supabase
            .from("user_data")
            .upsert({
              user_id: user.id,
              budget: legacyNextBudget,
              profile: legacyNextProfile,
            });

          if (migrationError) {
            throw migrationError;
          }

          localStorage.removeItem(localBudgetKey);
          localStorage.removeItem(localProfileKey);
          applyData(legacyNextBudget, legacyNextProfile, false);
          return;
        }

        if (cachedData) {
          applyData(cachedData.budget, cachedData.profile, false);
          return;
        }

        applyData(defaultBudget, defaultProfile(user.name, user.email), false);
      } catch (error) {
        const hasLocalData = cachedData !== null || legacyDataExists;

        if (!hasLocalData) {
          throw error;
        }

        applyData(
          cachedData?.budget ?? legacyNextBudget,
          cachedData?.profile ?? legacyNextProfile,
          cachedData?.pendingSync ?? legacyDataExists
        );
        setSyncError(
          error instanceof Error
            ? `Offline data is available on this device. Sync will retry when connected. (${error.message})`
            : "Offline data is available on this device. Sync will retry when connected."
        );
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
  }, [cacheKey, loadAttempt, user.email, user.id, user.name]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setSyncError(null);
    setStatus("loading");
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  const updateBudget = (updates: Partial<Budget>) => {
    const nextBudget = { ...budgetRef.current, ...updates };
    budgetRef.current = nextBudget;
    setBudget(nextBudget);

    try {
      writeCachedUserData(
        cacheKey,
        nextBudget,
        profileRef.current,
        pendingSyncRef.current
      );
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Could not save your data on this device."
      );
    }
  };

  const syncPendingData = useCallback(async () => {
    if (syncInProgressRef.current || !navigator.onLine) {
      return;
    }

    syncInProgressRef.current = true;

    try {
      const { error } = await supabase.from("user_data").upsert({
        user_id: user.id,
        budget: budgetRef.current,
        profile: profileRef.current,
      });

      if (error) {
        throw error;
      }

      writeCachedUserData(
        cacheKey,
        budgetRef.current,
        profileRef.current,
        false
      );
      pendingSyncRef.current = false;
      setHasPendingSync(false);
      setSyncError(null);
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Could not sync your data to Supabase."
      );
      throw error;
    } finally {
      syncInProgressRef.current = false;
    }
  }, [cacheKey, user.id]);

  useEffect(() => {
    if (status === "ready" && isOnline && hasPendingSync) {
      const timeoutId = window.setTimeout(() => {
        void syncPendingData().catch(() => undefined);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [hasPendingSync, isOnline, status, syncPendingData]);

  const saveBudget = async (): Promise<"synced" | "offline" | "queued"> => {
    writeCachedUserData(
      cacheKey,
      budgetRef.current,
      profileRef.current,
      true
    );
    pendingSyncRef.current = true;
    setHasPendingSync(true);

    if (!navigator.onLine) {
      setSyncError(null);
      return "offline";
    }

    try {
      await syncPendingData();
      return "synced";
    } catch {
      return "queued";
    }
  };

  const resetBudget = async (): Promise<"synced" | "offline" | "queued"> => {
    updateBudget({ ...defaultBudget, expenses: [] });
    return saveBudget();
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
    try {
      writeCachedUserData(
        cacheKey,
        budgetRef.current,
        nextProfile,
        pendingSyncRef.current
      );
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Could not save your data on this device."
      );
    }
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
        isOnline,
        hasPendingSync,
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

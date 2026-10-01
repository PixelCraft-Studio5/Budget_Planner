import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { getAccountStorageKey } from "../utils/accountStorage";

export interface AuthUser {
  email: string;
  name: string;
}

interface StoredAccount extends AuthUser {
  salt: string;
  passwordHash: string;
}

interface AuthContextType {
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  signOut: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const ACCOUNTS_KEY = "budget-planner-accounts";
const SESSION_KEY = "budget-planner-session";
const PASSWORD_ITERATIONS = 210_000;
const encoder = new TextEncoder();

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

function isStoredAccount(value: unknown): value is StoredAccount {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const account = value as Partial<StoredAccount>;

  return (
    typeof account.email === "string" &&
    typeof account.name === "string" &&
    typeof account.salt === "string" &&
    typeof account.passwordHash === "string"
  );
}

function readAccounts(): StoredAccount[] {
  const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);

  if (!storedAccounts) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(storedAccounts);
    return Array.isArray(parsed) ? parsed.filter(isStoredAccount) : [];
  } catch {
    return [];
  }
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function fromHex(value: string) {
  const bytes = new Uint8Array(value.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

async function hashPassword(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: Uint8Array.from(salt).buffer as ArrayBuffer,
      iterations: PASSWORD_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256
  );

  return toHex(new Uint8Array(bits));
}

function hashesMatch(expected: string, actual: string) {
  if (expected.length !== actual.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  }

  return difference === 0;
}

function getSessionUser(): AuthUser | null {
  const email = localStorage.getItem(SESSION_KEY);

  if (!email) {
    return null;
  }

  const account = readAccounts().find(
    (candidate) => candidate.email === email
  );

  return account
    ? { email: account.email, name: account.name }
    : null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(getSessionUser);

  const signUp = async (
    name: string,
    email: string,
    password: string
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const accounts = readAccounts();

    if (accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error("An account with this email already exists.");
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const account: StoredAccount = {
      email: normalizedEmail,
      name: trimmedName,
      salt: toHex(salt),
      passwordHash: await hashPassword(password, salt),
    };

    localStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify([...accounts, account])
    );

    if (accounts.length === 0) {
      const legacyBudget = localStorage.getItem("budget-planner-budget");

      if (legacyBudget) {
        localStorage.setItem(
          getAccountStorageKey("budget-planner-budget", normalizedEmail),
          legacyBudget
        );
        localStorage.removeItem("budget-planner-budget");
      }
    }

    localStorage.setItem(SESSION_KEY, normalizedEmail);
    setUser({ email: normalizedEmail, name: trimmedName });
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = readAccounts().find(
      (candidate) => candidate.email === normalizedEmail
    );

    if (!account) {
      throw new Error("No account found for this email address.");
    }

    const passwordHash = await hashPassword(
      password,
      fromHex(account.salt)
    );

    if (!hashesMatch(account.passwordHash, passwordHash)) {
      throw new Error("That password is incorrect.");
    }

    localStorage.setItem(SESSION_KEY, normalizedEmail);
    setUser({ email: account.email, name: account.name });
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
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
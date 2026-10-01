import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type { Budget } from "../types/budget";
import { getAccountStorageKey } from "../utils/accountStorage";
import { useAuth } from "./AuthContext";

interface BudgetContextType {
  budget: Budget;
  updateBudget: (updates: Partial<Budget>) => void;
  saveBudget: () => void;
  resetBudget: () => void;
}

interface BudgetProviderProps {
  children: ReactNode;
}

const defaultBudget: Budget = {
  workIncome: 0,
  sideHustleIncome: 0,
  savingTarget: 0,
  emergencyFund: 0,
  expenses: [],
};

const STORAGE_KEY =
  "budget-planner-budget";

const BudgetContext =
  createContext<BudgetContextType | undefined>(
    undefined
  );

function loadBudget(storageKey: string): Budget {
  const savedBudget = localStorage.getItem(storageKey);

  if (!savedBudget) {
    return defaultBudget;
  }

  try {
    const parsedBudget = JSON.parse(savedBudget) as Partial<Budget>;

    return {
      ...defaultBudget,
      ...parsedBudget,
      expenses: Array.isArray(parsedBudget.expenses)
        ? parsedBudget.expenses
        : [],
    };
  } catch (error) {
    console.error("Failed to load saved budget:", error);
    return defaultBudget;
  }
}

export function BudgetProvider({
  children,
}: BudgetProviderProps) {
  const { user } = useAuth();

  if (!user) {
    throw new Error("BudgetProvider requires a signed-in user");
  }

  const storageKey = getAccountStorageKey(STORAGE_KEY, user.email);
  const [budget, setBudget] = useState<Budget>(
    () => loadBudget(storageKey)
  );

  // ================================
  // UPDATE BUDGET
  // ================================

  const updateBudget = (
    updates: Partial<Budget>
  ) => {
    setBudget((currentBudget) => ({
      ...currentBudget,
      ...updates,
    }));
  };

  // ================================
  // SAVE BUDGET
  // ================================

  const saveBudget = () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify(budget)
    );
  };

  // ================================
  // RESET BUDGET
  // ================================

  const resetBudget = () => {
    setBudget(defaultBudget);

    localStorage.removeItem(
      storageKey
    );
  };

  return (
    <BudgetContext.Provider
      value={{
        budget,
        updateBudget,
        saveBudget,
        resetBudget,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(
    BudgetContext
  );

  if (!context) {
    throw new Error(
      "useBudget must be used inside a BudgetProvider"
    );
  }

  return context;
}
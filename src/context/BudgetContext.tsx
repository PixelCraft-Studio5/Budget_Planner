import { useUserData } from "./UserDataContext";

export function useBudget() {
  const {
    budget,
    updateBudget,
    saveBudget,
    resetBudget,
    isOnline,
    hasPendingSync,
    syncError,
  } = useUserData();

  return {
    budget,
    updateBudget,
    saveBudget,
    resetBudget,
    isOnline,
    hasPendingSync,
    syncError,
  };
}

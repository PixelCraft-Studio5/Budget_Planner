import { useUserData } from "./UserDataContext";

export function useBudget() {
  const {
    budget,
    updateBudget,
    saveBudget,
    resetBudget,
  } = useUserData();

  return { budget, updateBudget, saveBudget, resetBudget };
}

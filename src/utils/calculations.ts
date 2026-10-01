import type { Budget } from "../types/budget";

export const calculateTotalIncome = (
  budget: Budget
): number => {
  return (
    budget.workIncome +
    budget.sideHustleIncome
  );
};

export const calculateFixedExpenses = (
  budget: Budget
): number => {
  return budget.expenses
    .filter(
      (expense) =>
        expense.type === "fixed"
    )
    .reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );
};

export const calculateVariableExpenses = (
  budget: Budget
): number => {
  return budget.expenses
    .filter(
      (expense) =>
        expense.type === "variable"
    )
    .reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );
};

export const calculateTotalExpenses = (
  budget: Budget
): number => {
  return (
    calculateFixedExpenses(budget) +
    calculateVariableExpenses(budget)
  );
};

export const calculateTotalSavings = (
  budget: Budget
): number => {
  return (
    budget.savingTarget +
    budget.emergencyFund
  );
};

export const calculateSpendingMoney = (
  budget: Budget
): number => {
  return (
    calculateTotalIncome(budget) -
    calculateTotalExpenses(budget) -
    calculateTotalSavings(budget)
  );
};
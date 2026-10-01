export interface Expense {
  id: string;
  name: string;
  amount: number;
  type: "fixed" | "variable";
}

export interface Budget {
  workIncome: number;
  sideHustleIncome: number;

  savingTarget: number;
  emergencyFund: number;

  expenses: Expense[];
}
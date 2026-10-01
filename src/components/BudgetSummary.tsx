import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faArrowDown,
  faPiggyBank,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

import type { Budget } from "../types/budget";

interface BudgetSummaryProps {
  budget: Budget;
}

function BudgetSummary({
  budget,
}: BudgetSummaryProps) {
  const totalIncome =
    budget.workIncome +
    budget.sideHustleIncome;

  const totalExpenses =
    budget.expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );

  const totalSavings =
    budget.savingTarget +
    budget.emergencyFund;

  const spendingMoney =
    totalIncome -
    totalExpenses -
    totalSavings;

  return (
    <section className="budget-summary">

      <div className="summary-card income-summary">

        <div className="summary-icon">
          <FontAwesomeIcon icon={faArrowUp} />
        </div>

        <div>
          <p>Monthly Income</p>

          <h3>
            R{totalIncome.toLocaleString("en-ZA")}
          </h3>

          <span>
            Work + Side Hustle
          </span>
        </div>

      </div>

      <div className="summary-card expense-summary">

        <div className="summary-icon">
          <FontAwesomeIcon icon={faArrowDown} />
        </div>

        <div>
          <p>Monthly Expenses</p>

          <h3>
            R{totalExpenses.toLocaleString("en-ZA")}
          </h3>

          <span>
            Fixed + Variable
          </span>
        </div>

      </div>

      <div className="summary-card savings-summary">

        <div className="summary-icon">
          <FontAwesomeIcon icon={faPiggyBank} />
        </div>

        <div>
          <p>Total Savings</p>

          <h3>
            R{totalSavings.toLocaleString("en-ZA")}
          </h3>

          <span>
            Target + Emergency
          </span>
        </div>

      </div>

      <div
        className={`summary-card spending-summary ${
          spendingMoney < 0 ? "summary-negative" : ""
        }`}
      >

        <div className="summary-icon">
          <FontAwesomeIcon icon={faWallet} />
        </div>

        <div>
          <p>Spending Money</p>

          <h3>
            {spendingMoney < 0 ? "-R" : "R"}
            {Math.abs(spendingMoney).toLocaleString(
              "en-ZA"
            )}
          </h3>

          <span>
            Available this month
          </span>
        </div>

      </div>

    </section>
  );
}

export default BudgetSummary;
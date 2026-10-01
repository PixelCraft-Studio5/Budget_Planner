
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendDown,
  faArrowTrendUp,
  faBullseye,
  faChartPie,
  faCircleCheck,
  faCircleExclamation,
  faCoins,
  faCreditCard,
  faPiggyBank,
  faWallet,
  faTriangleExclamation,
  faReceipt,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import { useBudget } from "../context/BudgetContext";
import { useProfile } from "../context/ProfileContext";
import { formatCurrency } from "../utils/currency";
import {
  calculateTotalExpenses,
  calculateTotalIncome,
  calculateTotalSavings,
  calculateSpendingMoney,
} from "../utils/calculations";

function Dashboard() {
  const { budget } = useBudget();
  const { profile } = useProfile();

  /*
   * ========================================
   * CALCULATIONS
   * ========================================
   */

  const totalIncome =
    calculateTotalIncome(budget);

  const totalExpenses =
    calculateTotalExpenses(budget);

  const totalSavings =
    calculateTotalSavings(budget);

  const spendingMoney =
    calculateSpendingMoney(budget);

  /*
   * ========================================
   * MONTHLY BUDGET
   * ========================================
   */

  const monthlyBudget =
    profile.monthlyBudget;

  const budgetProgress =
    monthlyBudget > 0
      ? Math.min(
          (totalExpenses /
            monthlyBudget) *
            100,
          100
        )
      : 0;

  const budgetRemaining =
    monthlyBudget -
    totalExpenses;

  /*
   * ========================================
   * BUDGET HEALTH
   * ========================================
   */

  const getBudgetHealth = () => {
    if (spendingMoney < 0) {
      return {
        label: "Over Budget",
        description:
          "Your planned spending is higher than your available income.",
        className: "danger",
        icon: faTriangleExclamation,
      };
    }

    if (
      totalIncome > 0 &&
      spendingMoney <=
        totalIncome * 0.1
    ) {
      return {
        label: "Tight",
        description:
          "You have a small amount of money left after your planned expenses and savings.",
        className: "warning",
        icon: faCircleExclamation,
      };
    }

    return {
      label: "Healthy",
      description:
        "Your income currently covers your planned expenses and savings.",
      className: "healthy",
      icon: faCircleCheck,
    };
  };

  const budgetHealth =
    getBudgetHealth();

  /*
   * ========================================
   * BREAKDOWN PERCENTAGES
   * ========================================
   */

  const expensePercentage =
    totalIncome > 0
      ? Math.min(
          (totalExpenses /
            totalIncome) *
            100,
          100
        )
      : 0;

  const savingsPercentage =
    totalIncome > 0
      ? Math.min(
          (totalSavings /
            totalIncome) *
            100,
          100
        )
      : 0;

  const spendingPercentage =
    totalIncome > 0
      ? Math.min(
          (Math.max(spendingMoney, 0) /
            totalIncome) *
            100,
          100
        )
      : 0;

  /*
   * ========================================
   * EXPENSE ICON
   * ========================================
   */

  const getExpenseIcon = (
    name: string
  ) => {
    const expenseName =
      name.toLowerCase();

    if (
      expenseName.includes("rent") ||
      expenseName.includes("house") ||
      expenseName.includes("home")
    ) {
      return faWallet;
    }

    if (
      expenseName.includes("car") ||
      expenseName.includes("fuel") ||
      expenseName.includes("transport")
    ) {
      return faCreditCard;
    }

    if (
      expenseName.includes("food") ||
      expenseName.includes("grocery") ||
      expenseName.includes("groceries")
    ) {
      return faCoins;
    }

    if (
      expenseName.includes("save") ||
      expenseName.includes("investment")
    ) {
      return faPiggyBank;
    }

    return faReceipt;
  };

  /*
   * ========================================
   * BUDGET DATA CHECK
   * ========================================
   */

  const hasBudgetData =
    totalIncome > 0 ||
    totalExpenses > 0 ||
    totalSavings > 0;

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <header className="dashboard-header">

        <div>

          <p className="dashboard-eyebrow">
            Your financial overview
          </p>

          <h1>Welcome back, {profile.name || "User"}</h1>

          <p className="dashboard-subtitle">
            Here's how your monthly budget
            is looking.
          </p>

        </div>

      </header>

      {/* AVAILABLE SPENDING MONEY */}

      <section
        className={`available-money-card ${
          spendingMoney < 0
            ? "negative"
            : ""
        }`}
      >

        <div className="available-money-top">

          <div className="available-money-icon">
            <FontAwesomeIcon
              icon={faWallet}
            />
          </div>

          <span>
            Available Spending Money
          </span>

        </div>

        <h2>
          {spendingMoney < 0
            ? "-"
            : ""}

          {formatCurrency(
            spendingMoney,
            profile.currency
          )}
        </h2>

        <p>
          {spendingMoney < 0
            ? "Your planned expenses and savings are higher than your income."
            : "Money remaining after your planned expenses and savings."}
        </p>

        <div className="available-money-footer">

          <span>
            Monthly income
          </span>

          <strong>
            {formatCurrency(
              totalIncome,
              profile.currency
            )}
          </strong>

        </div>

      </section>

      {/* SUMMARY CARDS */}

      <section className="dashboard-summary-grid">

        <div className="dashboard-stat-card income">

          <div className="dashboard-stat-icon">
            <FontAwesomeIcon
              icon={faArrowTrendUp}
            />
          </div>

          <div>

            <span>
              Total Income
            </span>

            <strong>
              {formatCurrency(
                totalIncome,
                profile.currency
              )}
            </strong>

            <small>
              Work + side hustle
            </small>

          </div>

        </div>

        <div className="dashboard-stat-card expenses">

          <div className="dashboard-stat-icon">
            <FontAwesomeIcon
              icon={faArrowTrendDown}
            />
          </div>

          <div>

            <span>
              Total Expenses
            </span>

            <strong>
              {formatCurrency(
                totalExpenses,
                profile.currency
              )}
            </strong>

            <small>
              Fixed + variable
            </small>

          </div>

        </div>

        <div className="dashboard-stat-card savings">

          <div className="dashboard-stat-icon">
            <FontAwesomeIcon
              icon={faPiggyBank}
            />
          </div>

          <div>

            <span>
              Total Savings
            </span>

            <strong>
              {formatCurrency(
                totalSavings,
                profile.currency
              )}
            </strong>

            <small>
              Target + emergency fund
            </small>

          </div>

        </div>

      </section>

      {/* BUDGET HEALTH */}

      <section
        className={`budget-health-card ${budgetHealth.className}`}
      >

        <div className="budget-health-icon">

          <FontAwesomeIcon
            icon={budgetHealth.icon}
          />

        </div>

        <div className="budget-health-content">

          <div className="budget-health-heading">

            <span>
              Budget Health
            </span>

            <strong>
              {budgetHealth.label}
            </strong>

          </div>

          <p>
            {budgetHealth.description}
          </p>

        </div>

      </section>

      {/* MONTHLY BUDGET */}

      <section className="monthly-budget-card">

        <div className="monthly-budget-header">

          <div className="monthly-budget-title">

            <div className="monthly-budget-icon">
              <FontAwesomeIcon
                icon={faBullseye}
              />
            </div>

            <div>

              <h2>
                Monthly Budget
              </h2>

              <p>
                Your planned monthly spending
              </p>

            </div>

          </div>

          {monthlyBudget > 0 && (
            <span className="monthly-budget-percentage">
              {Math.round(budgetProgress)}%
            </span>
          )}

        </div>

        {monthlyBudget > 0 ? (
          <>

            <div className="monthly-budget-info">

              <div>

                <span>
                  Budget
                </span>

                <strong>
                  {formatCurrency(
                    monthlyBudget,
                    profile.currency
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Spent
                </span>

                <strong>
                  {formatCurrency(
                    totalExpenses,
                    profile.currency
                  )}
                </strong>

              </div>

            </div>

            <div
              className="monthly-budget-progress"
              aria-label={`Monthly budget ${Math.round(
                budgetProgress
              )}% used`}
            >

              <div
                className={
                  budgetRemaining < 0
                    ? "over"
                    : ""
                }
                style={{
                  width: `${budgetProgress}%`,
                }}
              />

            </div>

            <div
              className={`monthly-budget-message ${
                budgetRemaining < 0
                  ? "negative"
                  : ""
              }`}
            >

              <FontAwesomeIcon
                icon={
                  budgetRemaining < 0
                    ? faTriangleExclamation
                    : faCircleCheck
                }
              />

              <span>
                {budgetRemaining < 0
                  ? `You are ${formatCurrency(
                      Math.abs(
                        budgetRemaining
                      ),
                      profile.currency
                    )} over your monthly budget.`
                  : `${formatCurrency(
                      budgetRemaining,
                      profile.currency
                    )} remaining in your monthly budget.`}
              </span>

            </div>

          </>
        ) : (
          <div className="monthly-budget-empty">

            <FontAwesomeIcon
              icon={faBullseye}
            />

            <div>

              <strong>
                No monthly budget set
              </strong>

              <p>
                Set your monthly budget in
                your Profile to track your
                spending progress here.
              </p>

            </div>

          </div>
        )}

      </section>

      {/* BUDGET BREAKDOWN */}

      <section className="dashboard-card budget-breakdown-card">

        <div className="dashboard-card-header">

          <div>

            <p className="card-eyebrow">
              Overview
            </p>

            <h2>
              Budget Breakdown
            </h2>

          </div>

          <div className="dashboard-card-header-icon">
            <FontAwesomeIcon
              icon={faChartPie}
            />
          </div>

        </div>

        {totalIncome > 0 ? (
          <>

            <div className="breakdown-bar">

              <div
                className="breakdown-expenses"
                style={{
                  width: `${expensePercentage}%`,
                }}
              />

              <div
                className="breakdown-savings"
                style={{
                  width: `${savingsPercentage}%`,
                }}
              />

              <div
                className="breakdown-spending"
                style={{
                  width: `${spendingPercentage}%`,
                }}
              />

            </div>

            <div className="breakdown-legend">

              <div>

                <span className="legend-dot expenses-dot" />

                <div>

                  <strong>
                    {Math.round(
                      expensePercentage
                    )}%
                  </strong>

                  <span>
                    Expenses
                  </span>

                </div>

              </div>

              <div>

                <span className="legend-dot savings-dot" />

                <div>

                  <strong>
                    {Math.round(
                      savingsPercentage
                    )}%
                  </strong>

                  <span>
                    Savings
                  </span>

                </div>

              </div>

              <div>

                <span className="legend-dot spending-dot" />

                <div>

                  <strong>
                    {Math.round(
                      spendingPercentage
                    )}%
                  </strong>

                  <span>
                    Spending
                  </span>

                </div>

              </div>

            </div>

          </>
        ) : (
          <div className="dashboard-empty-state">

            <FontAwesomeIcon
              icon={faChartPie}
            />

            <strong>
              No budget data yet
            </strong>

            <p>
              Add your income and expenses in
              Budget Planner to see your
              breakdown.
            </p>

          </div>
        )}

      </section>

      {/* EXPENSE BREAKDOWN */}

      <section className="dashboard-card">

        <div className="dashboard-card-header">

          <div>

            <p className="card-eyebrow">
              Spending
            </p>

            <h2>
              Expense Breakdown
            </h2>

          </div>

          <div className="dashboard-card-header-icon">
            <FontAwesomeIcon
              icon={faReceipt}
            />
          </div>

        </div>

        {budget.expenses.length > 0 ? (
          <div className="dashboard-expense-list">

            {budget.expenses.map(
              (expense) => {

                const expensePercentage =
                  totalExpenses > 0
                    ? Math.round(
                        (expense.amount /
                          totalExpenses) *
                          100
                      )
                    : 0;

                return (
                  <div
                    className="dashboard-expense-item"
                    key={expense.id}
                  >

                    <div className="dashboard-expense-main">

                      <div className="dashboard-expense-icon">

                        <FontAwesomeIcon
                          icon={getExpenseIcon(
                            expense.name
                          )}
                        />

                      </div>

                      <div className="dashboard-expense-name">

                        <strong>
                          {expense.name}
                        </strong>

                        <span>
                          {expense.type ===
                          "fixed"
                            ? "Fixed expense"
                            : "Variable expense"}
                        </span>

                      </div>

                    </div>

                    <div className="dashboard-expense-amount">

                      <strong>
                        {formatCurrency(
                          expense.amount,
                          profile.currency
                        )}
                      </strong>

                      <span>
                        {expensePercentage}%
                      </span>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        ) : (
          <div className="dashboard-empty-state">

            <FontAwesomeIcon
              icon={faReceipt}
            />

            <strong>
              No expenses added
            </strong>

            <p>
              Your expense breakdown will
              appear here.
            </p>

          </div>
        )}

      </section>

      {/* SAVINGS PLAN */}

      <section className="dashboard-card savings-plan-card">

        <div className="dashboard-card-header">

          <div>

            <p className="card-eyebrow">
              Future goals
            </p>

            <h2>
              Savings Plan
            </h2>

          </div>

          <div className="dashboard-card-header-icon">
            <FontAwesomeIcon
              icon={faPiggyBank}
            />
          </div>

        </div>

        <div className="savings-plan-grid">

          <div className="savings-plan-item">

            <div className="savings-plan-item-icon">
              <FontAwesomeIcon
                icon={faBullseye}
              />
            </div>

            <div>

              <span>
                Saving Target
              </span>

              <strong>
                {formatCurrency(
                  budget.savingTarget,
                  profile.currency
                )}
              </strong>

            </div>

          </div>

          <div className="savings-plan-item">

            <div className="savings-plan-item-icon">
              <FontAwesomeIcon
                icon={faShieldHalved}
              />
            </div>

            <div>

              <span>
                Emergency Fund
              </span>

              <strong>
                {formatCurrency(
                  budget.emergencyFund,
                  profile.currency
                )}
              </strong>

            </div>

          </div>

        </div>

        <div className="savings-plan-total">

          <span>
            Total planned savings
          </span>

          <strong>
            {formatCurrency(
              totalSavings,
              profile.currency
            )}
          </strong>

        </div>

      </section>

      {/* BUDGET STATUS */}

      <section
        className={`dashboard-status-card ${
          spendingMoney < 0
            ? "negative"
            : "positive"
        }`}
      >

        <div className="dashboard-status-icon">

          <FontAwesomeIcon
            icon={
              spendingMoney < 0
                ? faTriangleExclamation
                : faCircleCheck
            }
          />

        </div>

        <div>

          <h2>
            {spendingMoney < 0
              ? "Budget needs attention"
              : "You're on track"}
          </h2>

          <p>
            {spendingMoney < 0
              ? "Your planned spending is higher than your available income. Consider reducing expenses or adjusting your savings targets."
              : hasBudgetData
                ? "Your current income covers your planned expenses and savings. Keep monitoring your spending throughout the month."
                : "Start by adding your income, expenses and savings goals in the Budget Planner."}
          </p>

        </div>

      </section>

      {/* MINI SUMMARY */}

      <section className="dashboard-mini-summary">

        <div>

          <span>
            Income
          </span>

          <strong>
            {formatCurrency(
              totalIncome,
              profile.currency
            )}
          </strong>

        </div>

        <div>

          <span>
            Expenses
          </span>

          <strong>
            {formatCurrency(
              totalExpenses,
              profile.currency
            )}
          </strong>

        </div>

        <div>

          <span>
            Savings
          </span>

          <strong>
            {formatCurrency(
              totalSavings,
              profile.currency
            )}
          </strong>

        </div>

        <div>

          <span>
            Spending
          </span>

          <strong
            className={
              spendingMoney < 0
                ? "negative-text"
                : ""
            }
          >
            {spendingMoney < 0
              ? "-"
              : ""}

            {formatCurrency(
              spendingMoney,
              profile.currency
            )}
          </strong>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;

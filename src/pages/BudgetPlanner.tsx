
import { useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faCalculator,
  faReceipt,
  faPiggyBank,
  faWallet,
  faRotateLeft,
  faFloppyDisk,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { useBudget } from "../context/BudgetContext";
import { useProfile } from "../context/ProfileContext";
import { formatCurrency } from "../utils/currency";

function BudgetPlanner() {
  const {
    budget,
    updateBudget,
    saveBudget,
    resetBudget,
  } = useBudget();

  const { profile } = useProfile();

  const {
    workIncome,
    sideHustleIncome,
    savingTarget,
    emergencyFund,
    expenses,
  } = budget;

  /*
   * ========================================
   * INPUT STATE
   * ========================================
   */

  const [workIncomeInput, setWorkIncomeInput] =
    useState(
      workIncome === 0
        ? ""
        : String(workIncome)
    );

  const [
    sideHustleIncomeInput,
    setSideHustleIncomeInput,
  ] = useState(
    sideHustleIncome === 0
      ? ""
      : String(sideHustleIncome)
  );

  const [savingTargetInput, setSavingTargetInput] =
    useState(
      savingTarget === 0
        ? ""
        : String(savingTarget)
    );

  const [
    emergencyFundInput,
    setEmergencyFundInput,
  ] = useState(
    emergencyFund === 0
      ? ""
      : String(emergencyFund)
  );

  const [expenseInputs, setExpenseInputs] =
    useState<Record<string, string>>(() => {
      const initialInputs: Record<
        string,
        string
      > = {};

      expenses.forEach((expense) => {
        initialInputs[expense.id] =
          expense.amount === 0
            ? ""
            : String(expense.amount);
      });

      return initialInputs;
    });

  /*
   * ========================================
   * MODAL + SAVE MESSAGE
   * ========================================
   */

  const [showResetModal, setShowResetModal] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  /*
   * ========================================
   * CALCULATIONS
   * ========================================
   */

  const totalIncome =
    workIncome + sideHustleIncome;

  const fixedExpenseItems =
    expenses.filter(
      (expense) =>
        expense.type === "fixed"
    );

  const variableExpenseItems =
    expenses.filter(
      (expense) =>
        expense.type === "variable"
    );

  const fixedCategoryTotal =
    fixedExpenseItems.reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );

  const variableCategoryTotal =
    variableExpenseItems.reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );

  const totalExpenses =
    fixedCategoryTotal +
    variableCategoryTotal;

  const totalSavings =
    savingTarget + emergencyFund;

  const spendingMoney =
    totalIncome -
    totalExpenses -
    totalSavings;

  /*
   * ========================================
   * HANDLE NUMBER INPUTS
   * ========================================
   */

  const handleIncomeInput = (
    field:
      | "workIncome"
      | "sideHustleIncome"
      | "savingTarget"
      | "emergencyFund",
    value: string
  ) => {
    /*
     * Allow only digits and one decimal point.
     */
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    /*
     * Keep the user's input as a string
     * while they are typing.
     */
    switch (field) {
      case "workIncome":
        setWorkIncomeInput(value);
        break;

      case "sideHustleIncome":
        setSideHustleIncomeInput(value);
        break;

      case "savingTarget":
        setSavingTargetInput(value);
        break;

      case "emergencyFund":
        setEmergencyFundInput(value);
        break;
    }

    /*
     * Empty input becomes zero.
     */
    if (value === "") {
      updateBudget({
        [field]: 0,
      });

      return;
    }

    const numberValue = Number(value);

    if (
      Number.isNaN(numberValue) ||
      numberValue < 0
    ) {
      return;
    }

    updateBudget({
      [field]: numberValue,
    });
  };

  /*
   * ========================================
   * ADD EXPENSE
   * ========================================
   */

  const addExpense = (
    type: "fixed" | "variable"
  ) => {
    const newExpense = {
      id: crypto.randomUUID(),
      name:
        type === "fixed"
          ? "New Fixed Expense"
          : "New Variable Expense",
      amount: 0,
      type,
    };

    updateBudget({
      expenses: [
        ...expenses,
        newExpense,
      ],
    });

    setExpenseInputs(
      (current) => ({
        ...current,
        [newExpense.id]: "",
      })
    );
  };

  /*
   * ========================================
   * UPDATE EXPENSE
   * ========================================
   */

  const updateExpense = (
    id: string,
    field: "name" | "amount",
    value: string
  ) => {
    /*
     * Update expense name.
     */
    if (field === "name") {
      updateBudget({
        expenses: expenses.map(
          (expense) =>
            expense.id === id
              ? {
                  ...expense,
                  name: value,
                }
              : expense
        ),
      });

      return;
    }

    /*
     * Update expense amount.
     */

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setExpenseInputs(
      (current) => ({
        ...current,
        [id]: value,
      })
    );

    const numberValue =
      value === ""
        ? 0
        : Number(value);

    if (
      Number.isNaN(numberValue) ||
      numberValue < 0
    ) {
      return;
    }

    updateBudget({
      expenses: expenses.map(
        (expense) =>
          expense.id === id
            ? {
                ...expense,
                amount: numberValue,
              }
            : expense
      ),
    });
  };

  /*
   * ========================================
   * DELETE EXPENSE
   * ========================================
   */

  const deleteExpense = (
    id: string
  ) => {
    updateBudget({
      expenses: expenses.filter(
        (expense) =>
          expense.id !== id
      ),
    });

    setExpenseInputs(
      (current) => {
        const updated = {
          ...current,
        };

        delete updated[id];

        return updated;
      }
    );
  };

  /*
   * ========================================
   * RESET BUDGET
   * ========================================
   */

  const handleReset = () => {
    resetBudget();

    setWorkIncomeInput("");
    setSideHustleIncomeInput("");
    setSavingTargetInput("");
    setEmergencyFundInput("");
    setExpenseInputs({});

    setSaveMessage("");
    setShowResetModal(false);
  };

  /*
   * ========================================
   * SAVE BUDGET
   * ========================================
   */

  const handleSave = () => {
    saveBudget();

    setSaveMessage(
      "Your budget has been saved successfully."
    );

    window.setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  };

  return (
    <div className="budget-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="page-header">
        <p className="eyebrow">
          Plan your money
        </p>

        <h1>Budget Planner</h1>

        <p>
          Set your monthly income, expenses and
          savings goals.
        </p>
      </header>

      {/* ========================================
          INCOME
      ======================================== */}

      <section className="budget-section">

        <div className="section-heading">

          <div className="section-icon">
            <FontAwesomeIcon icon={faCoins} />
          </div>

          <div>
            <h2>Income</h2>

            <p>
              Tell us how much money you earn
              each month.
            </p>
          </div>

        </div>

        {/* WORK INCOME */}

        <div className="input-group">

          <label htmlFor="workIncome">
            Work Income
          </label>

          <p>
            How much do you earn from your main
            job?
          </p>

          <div className="currency-input">

            <span>
              {profile.currency}
            </span>

            <input
              id="workIncome"
              type="text"
              inputMode="decimal"
              value={workIncomeInput}
              onChange={(event) =>
                handleIncomeInput(
                  "workIncome",
                  event.target.value
                )
              }
              placeholder="0.00"
            />

          </div>

        </div>

        {/* SIDE HUSTLE */}

        <div className="input-group">

          <label htmlFor="sideHustleIncome">
            Side Hustle Income
          </label>

          <p>
            How much do you earn from side
            hustles or additional income?
          </p>

          <div className="currency-input">

            <span>
              {profile.currency}
            </span>

            <input
              id="sideHustleIncome"
              type="text"
              inputMode="decimal"
              value={sideHustleIncomeInput}
              onChange={(event) =>
                handleIncomeInput(
                  "sideHustleIncome",
                  event.target.value
                )
              }
              placeholder="0.00"
            />

          </div>

        </div>

        {/* TOTAL INCOME */}

        <div className="total-card">

          <div>
            <span>Total Income</span>

            <h3>
              {formatCurrency(
                totalIncome,
                profile.currency
              )}
            </h3>
          </div>

          <FontAwesomeIcon
            icon={faCalculator}
          />

        </div>

      </section>

      {/* ========================================
          EXPENSES
      ======================================== */}

      <section className="budget-section expenses-section">

        <div className="section-heading">

          <div className="section-icon">
            <FontAwesomeIcon icon={faReceipt} />
          </div>

          <div>
            <h2>Expenses</h2>

            <p>
              Add your monthly expenses by
              category.
            </p>
          </div>

        </div>

        {/* FIXED EXPENSES */}

        <div className="expense-category">

          <div className="expense-category-header">

            <div>
              <h3>Fixed Expenses</h3>

              <p>
                Expenses that usually stay the
                same every month.
              </p>
            </div>

            <strong>
              {formatCurrency(
                fixedCategoryTotal,
                profile.currency
              )}
            </strong>

          </div>

          <div className="expense-list">

            {fixedExpenseItems.length === 0 ? (
              <p className="empty-expense-message">
                No fixed expenses added yet.
              </p>
            ) : (
              fixedExpenseItems.map(
                (expense) => (
                  <div
                    className="expense-item"
                    key={expense.id}
                  >

                    <input
                      className="expense-name-input"
                      type="text"
                      value={expense.name}
                      onChange={(event) =>
                        updateExpense(
                          expense.id,
                          "name",
                          event.target.value
                        )
                      }
                    />

                    <div className="expense-amount-wrapper">

                      <span>
                        {profile.currency}
                      </span>

                      <input
                        type="text"
                        inputMode="decimal"
                        value={
                          expenseInputs[
                            expense.id
                          ] ?? ""
                        }
                        onChange={(event) =>
                          updateExpense(
                            expense.id,
                            "amount",
                            event.target.value
                          )
                        }
                        placeholder="0.00"
                      />

                    </div>

                    <button
                      type="button"
                      className="delete-expense-button"
                      onClick={() =>
                        deleteExpense(
                          expense.id
                        )
                      }
                      aria-label={`Delete ${expense.name}`}
                    >
                      <FontAwesomeIcon
                        icon={faTrash}
                      />
                    </button>

                  </div>
                )
              )
            )}

          </div>

          <button
            type="button"
            className="add-expense-button"
            onClick={() =>
              addExpense("fixed")
            }
          >
            <FontAwesomeIcon
              icon={faPlus}
            />

            Add Fixed Expense
          </button>

        </div>

        {/* VARIABLE EXPENSES */}

        <div className="expense-category">

          <div className="expense-category-header">

            <div>
              <h3>Variable Expenses</h3>

              <p>
                Expenses that can change from
                month to month.
              </p>
            </div>

            <strong>
              {formatCurrency(
                variableCategoryTotal,
                profile.currency
              )}
            </strong>

          </div>

          <div className="expense-list">

            {variableExpenseItems.length === 0 ? (
              <p className="empty-expense-message">
                No variable expenses added yet.
              </p>
            ) : (
              variableExpenseItems.map(
                (expense) => (
                  <div
                    className="expense-item"
                    key={expense.id}
                  >

                    <input
                      className="expense-name-input"
                      type="text"
                      value={expense.name}
                      onChange={(event) =>
                        updateExpense(
                          expense.id,
                          "name",
                          event.target.value
                        )
                      }
                    />

                    <div className="expense-amount-wrapper">

                      <span>
                        {profile.currency}
                      </span>

                      <input
                        type="text"
                        inputMode="decimal"
                        value={
                          expenseInputs[
                            expense.id
                          ] ?? ""
                        }
                        onChange={(event) =>
                          updateExpense(
                            expense.id,
                            "amount",
                            event.target.value
                          )
                        }
                        placeholder="0.00"
                      />

                    </div>

                    <button
                      type="button"
                      className="delete-expense-button"
                      onClick={() =>
                        deleteExpense(
                          expense.id
                        )
                      }
                      aria-label={`Delete ${expense.name}`}
                    >
                      <FontAwesomeIcon
                        icon={faTrash}
                      />
                    </button>

                  </div>
                )
              )
            )}

          </div>

          <button
            type="button"
            className="add-expense-button"
            onClick={() =>
              addExpense("variable")
            }
          >
            <FontAwesomeIcon
              icon={faPlus}
            />

            Add Variable Expense
          </button>

        </div>

        {/* TOTAL EXPENSES */}

        <div className="expense-total-card">

          <div>
            <span>Total Expenses</span>

            <h3>
              {formatCurrency(
                totalExpenses,
                profile.currency
              )}
            </h3>
          </div>

          <FontAwesomeIcon
            icon={faReceipt}
          />

        </div>

      </section>

      {/* ========================================
          SAVINGS
      ======================================== */}

      <section className="budget-section savings-section">

        <div className="section-heading">

          <div className="section-icon">
            <FontAwesomeIcon
              icon={faPiggyBank}
            />
          </div>

          <div>
            <h2>Savings</h2>

            <p>
              Decide how much you want to save
              every month.
            </p>
          </div>

        </div>

        {/* SAVING TARGET */}

        <div className="input-group">

          <label htmlFor="savingTarget">
            Saving Target
          </label>

          <p>
            How much do you want to save each
            month?
          </p>

          <div className="currency-input">

            <span>
              {profile.currency}
            </span>

            <input
              id="savingTarget"
              type="text"
              inputMode="decimal"
              value={savingTargetInput}
              onChange={(event) =>
                handleIncomeInput(
                  "savingTarget",
                  event.target.value
                )
              }
              placeholder="0.00"
            />

          </div>

        </div>

        {/* EMERGENCY FUND */}

        <div className="input-group">

          <label htmlFor="emergencyFund">
            Emergency Fund
          </label>

          <p>
            How much do you want to put toward
            your emergency fund?
          </p>

          <div className="currency-input">

            <span>
              {profile.currency}
            </span>

            <input
              id="emergencyFund"
              type="text"
              inputMode="decimal"
              value={emergencyFundInput}
              onChange={(event) =>
                handleIncomeInput(
                  "emergencyFund",
                  event.target.value
                )
              }
              placeholder="0.00"
            />

          </div>

        </div>

        {/* TOTAL SAVINGS */}

        <div className="savings-total-card">

          <div>
            <span>Total Savings</span>

            <h3>
              {formatCurrency(
                totalSavings,
                profile.currency
              )}
            </h3>
          </div>

          <FontAwesomeIcon
            icon={faPiggyBank}
          />

        </div>

      </section>

      {/* ========================================
          SPENDING MONEY
      ======================================== */}

      <section
        className={`spending-card ${
          spendingMoney < 0
            ? "negative"
            : ""
        }`}
      >

        <div className="spending-card-icon">
          <FontAwesomeIcon icon={faWallet} />
        </div>

        <div>

          <p>
            Available Spending Money
          </p>

          <h2>
            {spendingMoney < 0
              ? "-"
              : ""}

            {formatCurrency(
              spendingMoney,
              profile.currency
            )}
          </h2>

          {spendingMoney < 0 ? (
            <span>
              Your budget is over your available
              income. Consider reducing expenses
              or adjusting your savings target.
            </span>
          ) : (
            <span>
              This is what remains after your
              expenses and savings.
            </span>
          )}

        </div>

      </section>

      {/* ========================================
          ACTIONS
      ======================================== */}

      <div className="budget-actions">

        {/* SAVE SUCCESS MESSAGE */}

        {saveMessage && (
          <div className="budget-save-message">

            <FontAwesomeIcon
              icon={faFloppyDisk}
            />

            <span>
              {saveMessage}
            </span>

          </div>
        )}

        {/* SAVE */}

        <button
          type="button"
          className="save-budget-button"
          onClick={handleSave}
        >
          <FontAwesomeIcon
            icon={faFloppyDisk}
          />

          Save Budget
        </button>

        {/* RESET */}

        <button
          type="button"
          className="reset-budget-button"
          onClick={() =>
            setShowResetModal(true)
          }
        >
          <FontAwesomeIcon
            icon={faRotateLeft}
          />

          Reset Budget
        </button>

      </div>

      {/* ========================================
          RESET CONFIRMATION MODAL
      ======================================== */}

      {showResetModal && (
        <div className="reset-modal-overlay">

          <div
            className="reset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
          >

            <div className="reset-modal-icon">

              <FontAwesomeIcon
                icon={faRotateLeft}
              />

            </div>

            <h2 id="reset-modal-title">
              Reset your budget?
            </h2>

            <p>
              This will remove all your income,
              expenses and savings information.
              This action cannot be undone.
            </p>

            <div className="reset-modal-actions">

              <button
                type="button"
                className="reset-modal-cancel"
                onClick={() =>
                  setShowResetModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="reset-modal-confirm"
                onClick={handleReset}
              >
                Reset Budget
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default BudgetPlanner;


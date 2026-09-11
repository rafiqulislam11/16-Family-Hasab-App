/**
 * খাতা — Accounting Calculations Engine
 * 
 * CRITICAL ACCOUNTING RULES:
 * 1. Business Profit = Sales + Business Income - Business Expenses
 * 2. Net Savings = Business Profit + Other Personal Income - Household Expenses
 * Household expenses are NEVER subtracted from Business Profit!
 */

const Accounting = {
  /**
   * Filter transactions by date range
   */
  filterTransactions(transactions, startDate, endDate) {
    if (!transactions) return [];
    return transactions.filter(t => {
      if (!t.date) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
  },

  /**
   * Calculate complete financial metrics for a set of transactions
   */
  calculateMetrics(transactions, debts = []) {
    let totalSales = 0;
    let businessIncome = 0;
    let personalIncome = 0;
    let shopExpenses = 0;
    let householdExpenses = 0;
    let totalTransfers = 0;
    let totalSavingsDeposited = 0;

    // Cash flow by payment method
    let cashIn = 0;
    let cashOut = 0;

    const categoryBreakdown = {};

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      const type = t.type;
      const isCash = t.paymentMethod === 'Cash' || t.paymentMethod === 'নগদ';

      if (type === 'INCOME') {
        if (t.isSales || t.category === 'cat_inc_sales' || t.category === 'cat_inc_online') {
          totalSales += amount;
          businessIncome += amount;
        } else if (t.category === 'cat_inc_personal') {
          personalIncome += amount;
        } else {
          // Other business income (services, commission, etc.)
          businessIncome += amount;
        }

        if (isCash) cashIn += amount;

      } else if (type === 'EXPENSE') {
        const expType = t.expenseType || (t.category && t.category.includes('shop') ? 'EXPENSE_SHOP' : 'EXPENSE_HOUSE');

        if (expType === 'EXPENSE_SHOP') {
          shopExpenses += amount;
        } else {
          householdExpenses += amount;
        }

        if (isCash) cashOut += amount;

        // Group category breakdown
        const catName = t.categoryName || 'অন্যান্য';
        if (!categoryBreakdown[catName]) {
          categoryBreakdown[catName] = { name: catName, amount: 0, type: expType };
        }
        categoryBreakdown[catName].amount += amount;

      } else if (type === 'TRANSFER') {
        totalTransfers += amount;
      } else if (type === 'SAVING') {
        totalSavingsDeposited += amount;
        if (isCash) cashOut += amount;
      }
    });

    // 1. Business Profit
    const businessProfit = businessIncome - shopExpenses;

    // 2. Net Savings
    const totalAllIncome = businessIncome + personalIncome;
    const totalAllExpenses = shopExpenses + householdExpenses;
    const netSavings = businessProfit + personalIncome - householdExpenses;

    // 3. Cash in Hand
    const netCashInHand = cashIn - cashOut;

    // 4. Debt totals
    let totalReceivable = 0; // আমি পাব
    let totalPayable = 0;    // আমি দেব

    debts.forEach(d => {
      const remaining = Number(d.remainingAmount !== undefined ? d.remainingAmount : (d.amount - (d.paidAmount || 0))) || 0;
      if (d.type === 'RECEIVABLE') {
        totalReceivable += remaining;
      } else if (d.type === 'PAYABLE') {
        totalPayable += remaining;
      }
    });

    const netDebtPosition = totalReceivable - totalPayable;

    // 5. Sorted top categories
    const sortedCategories = Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount);
    const totalExpenseSum = shopExpenses + householdExpenses;
    sortedCategories.forEach(c => {
      c.percentage = totalExpenseSum > 0 ? ((c.amount / totalExpenseSum) * 100).toFixed(1) : 0;
    });

    return {
      totalSales,
      businessIncome,
      personalIncome,
      totalIncome: totalAllIncome,
      shopExpenses,
      householdExpenses,
      totalExpenses: totalAllExpenses,
      businessProfit,
      netSavings,
      cashIn,
      cashOut,
      netCashInHand,
      totalReceivable,
      totalPayable,
      netDebtPosition,
      topCategories: sortedCategories
    };
  },

  /**
   * Helper to get date boundaries for standard periods
   */
  getDateRangeForPeriod(period = 'today', customStart = null, customEnd = null) {
    const today = new Date();
    const todayStr = Utils.toInputDate(today);

    if (period === 'today') {
      return { start: todayStr, end: todayStr, label: 'আজ' };
    }

    if (period === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = Utils.toInputDate(y);
      return { start: yStr, end: yStr, label: 'গতকাল' };
    }

    if (period === 'thisWeek') {
      const curr = new Date(today);
      const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay()));
      return {
        start: Utils.toInputDate(firstDay),
        end: todayStr,
        label: 'এই সপ্তাহ'
      };
    }

    if (period === 'thisMonth') {
      const y = today.getFullYear();
      const m = today.getMonth();
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0);
      return {
        start: Utils.toInputDate(first),
        end: Utils.toInputDate(last),
        label: 'এই মাস'
      };
    }

    if (period === 'lastMonth') {
      const y = today.getFullYear();
      const m = today.getMonth() - 1;
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0);
      return {
        start: Utils.toInputDate(first),
        end: Utils.toInputDate(last),
        label: 'গত মাস'
      };
    }

    if (period === 'thisYear') {
      const y = today.getFullYear();
      const first = new Date(y, 0, 1);
      const last = new Date(y, 11, 31);
      return {
        start: Utils.toInputDate(first),
        end: Utils.toInputDate(last),
        label: 'এই বছর'
      };
    }

    if (period === 'custom' && customStart && customEnd) {
      return {
        start: customStart,
        end: customEnd,
        label: `${Utils.formatDateBengali(customStart)} হতে ${Utils.formatDateBengali(customEnd)}`
      };
    }

    return { start: todayStr, end: todayStr, label: 'আজ' };
  },

  /**
   * Budget analysis
   * Compares actual spent vs assigned budget
   */
  evaluateBudget(budget, monthlyTransactions) {
    const targetAmount = Number(budget.amount) || 0;
    let usedAmount = 0;

    monthlyTransactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        const expType = t.expenseType || (t.category && t.category.includes('shop') ? 'EXPENSE_SHOP' : 'EXPENSE_HOUSE');
        if (budget.type === expType) {
          usedAmount += Number(t.amount) || 0;
        }
      }
    });

    const remainingAmount = targetAmount - usedAmount;
    const percentUsed = targetAmount > 0 ? (usedAmount / targetAmount) * 100 : 0;

    let status = 'normal'; // green
    if (percentUsed >= 100) {
      status = 'exceeded'; // red alert
    } else if (percentUsed >= 80) {
      status = 'warning'; // yellow warning
    }

    return {
      budget,
      targetAmount,
      usedAmount,
      remainingAmount,
      percentUsed: Math.min(percentUsed, 100).toFixed(1),
      actualPercent: percentUsed.toFixed(1),
      status
    };
  }
};

window.Accounting = Accounting;

/**
 * RI Family & Business Hisab — Accounting Calculations Engine
 * 
 * CORE ACCOUNTING PRINCIPLES:
 * 1. Revenue - COGS (Cost of Goods Sold) = Gross Profit
 * 2. Gross Profit - Operating Expenses = Net Business Operating Profit
 * 3. Household/Family expenses are NEVER deducted from Business Profit!
 * 4. Money Transfers (Account to Account or Business -> Family) are NEITHER Income NOR Expense.
 * 5. Customer Payments reduce Receivables; Supplier Payments reduce Payables.
 * 6. Financial account balances (Cash, Bank, bKash, Nagad) remain strictly consistent.
 */

const Accounting = {
  /**
   * Filter items (transactions, sales, purchases) by date range (inclusive)
   */
  filterByDateRange(items, startDate, endDate) {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
      if (!item.date) return false;
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      return true;
    });
  },

  /**
   * Legacy alias for filterByDateRange
   */
  filterTransactions(transactions, startDate, endDate) {
    return this.filterByDateRange(transactions, startDate, endDate);
  },

  /**
   * Calculate complete financial metrics across Business & Family contexts
   */
  calculateMetrics(transactions = [], debts = [], sales = [], saleItems = [], products = [], filterContext = 'ALL') {
    let totalSalesRevenue = 0;
    let businessIncome = 0;
    let personalFamilyIncome = 0;
    let shopOperatingExpenses = 0;
    let householdExpenses = 0;
    let totalTransfers = 0;
    let totalSavingsDeposited = 0;
    let directInventoryPurchases = 0;

    // Account balances tracking
    const accountBalances = {
      Cash: 0,
      Bank: 0,
      bKash: 0,
      Nagad: 0,
      Rocket: 0,
      Other: 0
    };

    let totalCashIn = 0;
    let totalCashOut = 0;

    const categoryBreakdown = {};
    const familyCategoryBreakdown = {};

    // 1. Process Unified Transactions
    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      const type = t.type;
      const method = t.paymentMethod || 'Cash';
      const normMethod = this._normalizeMethod(method);
      const isCash = normMethod === 'Cash';

      if (type === 'INCOME' || type === 'SALE') {
        const isFamily = t.category === 'cat_inc_personal' || t.context === 'FAMILY';

        if (isFamily) {
          personalFamilyIncome += amount;
        } else {
          totalSalesRevenue += amount;
          businessIncome += amount;
        }

        accountBalances[normMethod] = (accountBalances[normMethod] || 0) + amount;
        if (isCash) totalCashIn += amount;

      } else if (type === 'EXPENSE' || type === 'PURCHASE') {
        const isPurchase = t.category === 'cat_exp_stock' || type === 'PURCHASE';
        const expType = t.expenseType || (t.category && t.category.includes('shop') ? 'EXPENSE_SHOP' : 'EXPENSE_HOUSE');

        if (expType === 'EXPENSE_SHOP' || t.context === 'BUSINESS') {
          if (isPurchase) {
            directInventoryPurchases += amount;
          } else {
            shopOperatingExpenses += amount;
          }

          const catName = t.categoryName || 'দোকান খরচ';
          if (!categoryBreakdown[catName]) categoryBreakdown[catName] = { name: catName, amount: 0, type: 'EXPENSE_SHOP' };
          categoryBreakdown[catName].amount += amount;

        } else {
          // Household Expense
          householdExpenses += amount;
          const catName = t.categoryName || 'সংসার খরচ';
          if (!familyCategoryBreakdown[catName]) familyCategoryBreakdown[catName] = { name: catName, amount: 0, type: 'EXPENSE_HOUSE' };
          familyCategoryBreakdown[catName].amount += amount;
        }

        accountBalances[normMethod] = (accountBalances[normMethod] || 0) - amount;
        if (isCash) totalCashOut += amount;

      } else if (type === 'TRANSFER') {
        // Transfers are NEITHER income NOR expense!
        totalTransfers += amount;
        const fromMethod = this._normalizeMethod(t.fromAccount || t.paymentMethod || 'Cash');
        const toMethod = this._normalizeMethod(t.toAccount || 'Bank');
        accountBalances[fromMethod] = (accountBalances[fromMethod] || 0) - amount;
        accountBalances[toMethod] = (accountBalances[toMethod] || 0) + amount;

        if (fromMethod === 'Cash') totalCashOut += amount;
        if (toMethod === 'Cash') totalCashIn += amount;

      } else if (type === 'CUSTOMER_PAYMENT') {
        // Customer paying due
        accountBalances[normMethod] = (accountBalances[normMethod] || 0) + amount;
        if (isCash) totalCashIn += amount;

      } else if (type === 'SUPPLIER_PAYMENT') {
        // Paying supplier
        accountBalances[normMethod] = (accountBalances[normMethod] || 0) - amount;
        if (isCash) totalCashOut += amount;

      } else if (type === 'SAVING') {
        totalSavingsDeposited += amount;
        accountBalances[normMethod] = (accountBalances[normMethod] || 0) - amount;
        if (isCash) totalCashOut += amount;
      }
    });

    // 2. Calculate COGS (Cost of Goods Sold)
    let calculatedCOGS = 0;
    if (sales && sales.length > 0 && saleItems && saleItems.length > 0) {
      const prodCostMap = {};
      (products || []).forEach(p => {
        prodCostMap[p.id] = Number(p.buyingPrice || p.buyPrice) || 0;
      });

      saleItems.forEach(item => {
        const qty = Number(item.qty || item.quantity) || 0;
        const unitCost = Number(item.costPrice !== undefined ? item.costPrice : (prodCostMap[item.productId] || 0));
        calculatedCOGS += (qty * unitCost);
      });
    } else {
      // If no itemized sale items yet, use direct inventory purchases as proxy
      calculatedCOGS = directInventoryPurchases;
    }

    // 3. Business Profitability
    const grossProfit = Math.round((totalSalesRevenue - calculatedCOGS) * 100) / 100;
    const netBusinessProfit = Math.round((grossProfit - shopOperatingExpenses) * 100) / 100;

    // 4. Family Financial Metrics
    const totalFamilyIncome = personalFamilyIncome;
    const netFamilySavings = Math.round((totalFamilyIncome - householdExpenses) * 100) / 100;

    // 5. Debt Positions (Receivable vs Payable)
    let totalReceivable = 0; // আমি পাব (Customer Due)
    let totalPayable = 0;    // আমি দেব (Supplier Due)

    debts.forEach(d => {
      const remaining = Number(d.remainingAmount !== undefined ? d.remainingAmount : (d.amount - (d.paidAmount || 0))) || 0;
      if (d.type === 'RECEIVABLE') {
        totalReceivable += remaining;
      } else if (d.type === 'PAYABLE') {
        totalPayable += remaining;
      }
    });

    const netDebtPosition = totalReceivable - totalPayable;

    // 6. Overall Combined Net Worth / Liquidity
    const totalAccountLiquidity = (accountBalances.Cash || 0) + (accountBalances.Bank || 0) + (accountBalances.bKash || 0) + (accountBalances.Nagad || 0) + (accountBalances.Rocket || 0) + (accountBalances.Other || 0);

    // 7. Sorted category breakdowns
    const sortedShopCategories = Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount);
    const sortedFamilyCategories = Object.values(familyCategoryBreakdown).sort((a, b) => b.amount - a.amount);

    return {
      // Business
      totalSales: totalSalesRevenue,
      businessIncome,
      inventoryPurchases: directInventoryPurchases,
      cogs: calculatedCOGS,
      grossProfit,
      shopExpenses: shopOperatingExpenses,
      businessProfit: netBusinessProfit,
      netBusinessProfit,

      // Family
      personalIncome: personalFamilyIncome,
      familyIncome: totalFamilyIncome,
      householdExpenses,
      netSavings: netFamilySavings,
      familyNetSavings: netFamilySavings,

      // Totals
      totalIncome: totalSalesRevenue + personalFamilyIncome,
      totalExpenses: shopOperatingExpenses + householdExpenses,
      totalTransfers,
      totalSavingsDeposited,

      // Cash Flow & Accounts
      cashIn: totalCashIn,
      cashOut: totalCashOut,
      netCashInHand: totalCashIn - totalCashOut,
      accountBalances,
      totalLiquidity: totalAccountLiquidity,

      // Due
      totalReceivable,
      totalPayable,
      netDebtPosition,

      // Breakdowns
      topCategories: sortedShopCategories,
      shopCategories: sortedShopCategories,
      familyCategories: sortedFamilyCategories
    };
  },

  _normalizeMethod(method = '') {
    if (!method) return 'Cash';
    const m = method.toLowerCase();
    if (m.includes('cash') || m.includes('নগদ')) return 'Cash';
    if (m.includes('bank') || m.includes('ব্যাংক')) return 'Bank';
    if (m.includes('bkash') || m.includes('বিকাশ')) return 'bKash';
    if (m.includes('nagad')) return 'Nagad';
    if (m.includes('rocket') || m.includes('রকেট')) return 'Rocket';
    return 'Other';
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

    if (period === '7days' || period === 'thisWeek') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return {
        start: Utils.toInputDate(d),
        end: todayStr,
        label: 'গত ৭ দিন'
      };
    }

    if (period === '30days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return {
        start: Utils.toInputDate(d),
        end: todayStr,
        label: 'গত ৩০ দিন'
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

    (monthlyTransactions || []).forEach(t => {
      if (t.type === 'EXPENSE' || t.type === 'PURCHASE') {
        const expType = t.expenseType || (t.category && t.category.includes('shop') ? 'EXPENSE_SHOP' : 'EXPENSE_HOUSE');
        if (budget.type === expType || budget.category === t.category) {
          usedAmount += Number(t.amount) || 0;
        }
      }
    });

    const remainingAmount = Math.max(0, targetAmount - usedAmount);
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
  },

  /**
   * Generate Full Profit & Loss Statement (P&L)
   */
  generateProfitAndLoss(transactions = [], sales = [], saleItems = [], products = [], startDate = null, endDate = null) {
    const periodTx = this.filterByDateRange(transactions, startDate, endDate);
    const periodSales = this.filterByDateRange(sales, startDate, endDate);
    const metrics = this.calculateMetrics(periodTx, [], periodSales, saleItems, products);

    return {
      period: { startDate, endDate },
      revenue: metrics.totalSales,
      cogs: metrics.cogs,
      grossProfit: metrics.grossProfit,
      grossMarginPercent: metrics.totalSales > 0 ? ((metrics.grossProfit / metrics.totalSales) * 100).toFixed(1) : 0,
      operatingExpenses: metrics.shopExpenses,
      operatingExpenseBreakdown: metrics.shopCategories,
      netOperatingProfit: metrics.netBusinessProfit,
      netMarginPercent: metrics.totalSales > 0 ? ((metrics.netBusinessProfit / metrics.totalSales) * 100).toFixed(1) : 0,
      familyDrawTransfers: metrics.totalTransfers,
      isProfitable: metrics.netBusinessProfit >= 0
    };
  }
};

window.Accounting = Accounting;
window.Calculations = Accounting;

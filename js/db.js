/**
 * RI Family & Business Hisab — IndexedDB Storage Engine (KhataDB)
 * 20 Object Stores: transactions, categories, debts, debtPayments, budgets, savingGoals,
 * settings, appProfile, accounts, products, dailyClosings, sales, saleItems, purchases,
 * purchaseItems, customers, suppliers, stockMovements, financialAccounts, auditLogs
 */

const DB_NAME = 'KhataDB_v2';
const DB_VERSION = 5;

class KhataDatabase {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Transactions
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('paymentMethod', 'paymentMethod', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 2. Categories
        if (!db.objectStoreNames.contains('categories')) {
          const store = db.createObjectStore('categories', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
        }

        // 3. Debts (ধার-বাকি: আমি পাব / আমি দেব)
        if (!db.objectStoreNames.contains('debts')) {
          const store = db.createObjectStore('debts', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false }); // RECEIVABLE (আমি পাব) or PAYABLE (আমি দেব)
          store.createIndex('person', 'person', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 4. Debt Payments (ধার পরিশোধের খতিয়ান)
        if (!db.objectStoreNames.contains('debtPayments')) {
          const store = db.createObjectStore('debtPayments', { keyPath: 'id' });
          store.createIndex('debtId', 'debtId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 5. Budgets (মাসিক বাজেট)
        if (!db.objectStoreNames.contains('budgets')) {
          const store = db.createObjectStore('budgets', { keyPath: 'id' });
          store.createIndex('month', 'month', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 6. Saving Goals (সঞ্চয় লক্ষ্য)
        if (!db.objectStoreNames.contains('savingGoals')) {
          const store = db.createObjectStore('savingGoals', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 7. Settings (থিম, পিন, নোটিফিকেশন)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // 8. App Profile (মালিক, দোকান নাম, ঠিকানা)
        if (!db.objectStoreNames.contains('appProfile')) {
          db.createObjectStore('appProfile', { keyPath: 'key' });
        }

        // 9. Accounts & Users (মাল্টি-ইউজার ও বিজনেস লগইন)
        if (!db.objectStoreNames.contains('accounts')) {
          const store = db.createObjectStore('accounts', { keyPath: 'id' });
          store.createIndex('phone', 'phone', { unique: false });
          store.createIndex('email', 'email', { unique: false });
        }

        // 10. Products & Stock Inventory (পণ্য ও মজুত খাতা)
        if (!db.objectStoreNames.contains('products')) {
          const store = db.createObjectStore('products', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 11. Daily Cash Drawer Closings (দিনের শেষে ক্যাশ ড্রয়ার মিলানো)
        if (!db.objectStoreNames.contains('dailyClosings')) {
          const store = db.createObjectStore('dailyClosings', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 12. Sales (বিক্রি ও পিওএস চালান)
        if (!db.objectStoreNames.contains('sales')) {
          const store = db.createObjectStore('sales', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('customerId', 'customerId', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
          store.createIndex('invoiceNo', 'invoiceNo', { unique: false });
        }

        // 13. Sale Items (বিক্রিত পণ্যের তালিকা)
        if (!db.objectStoreNames.contains('saleItems')) {
          const store = db.createObjectStore('saleItems', { keyPath: 'id' });
          store.createIndex('saleId', 'saleId', { unique: false });
          store.createIndex('productId', 'productId', { unique: false });
        }

        // 14. Purchases (মালামাল ক্রয় ও চালান)
        if (!db.objectStoreNames.contains('purchases')) {
          const store = db.createObjectStore('purchases', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('supplierId', 'supplierId', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
          store.createIndex('purchaseNo', 'purchaseNo', { unique: false });
        }

        // 15. Purchase Items (ক্রয়কৃত পণ্যের তালিকা)
        if (!db.objectStoreNames.contains('purchaseItems')) {
          const store = db.createObjectStore('purchaseItems', { keyPath: 'id' });
          store.createIndex('purchaseId', 'purchaseId', { unique: false });
          store.createIndex('productId', 'productId', { unique: false });
        }

        // 16. Customers (কাস্টমার ডিরেক্টরি ও লেজার)
        if (!db.objectStoreNames.contains('customers')) {
          const store = db.createObjectStore('customers', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('phone', 'phone', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 17. Suppliers (মহাজন / সরবরাহকারী খাতা)
        if (!db.objectStoreNames.contains('suppliers')) {
          const store = db.createObjectStore('suppliers', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('phone', 'phone', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 18. Stock Movements (মজুত হ্রাস-বৃদ্ধির ট্র্যাকিং)
        if (!db.objectStoreNames.contains('stockMovements')) {
          const store = db.createObjectStore('stockMovements', { keyPath: 'id' });
          store.createIndex('productId', 'productId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 19. Financial Accounts (ক্যাশ, ব্যাংক ও মোবাইল ওয়ালেট হিসাব)
        if (!db.objectStoreNames.contains('financialAccounts')) {
          const store = db.createObjectStore('financialAccounts', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }

        // 20. Audit Logs (অ্যাক্টিভিটি ও অডিট লগ)
        if (!db.objectStoreNames.contains('auditLogs')) {
          const store = db.createObjectStore('auditLogs', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('action', 'action', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        this.isReady = true;
        await this._seedInitialDefaults();
        resolve(this);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // --- Generic Store Operations ---

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      if (!item.createdAt) item.createdAt = new Date().toISOString();
      item.updatedAt = new Date().toISOString();
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Specialized Helpers ---

  async getTransactionsByDateRange(startDate, endDate) {
    const all = await this.getAll('transactions');
    return all.filter(t => t.date >= startDate && t.date <= endDate);
  }

  async getDebtsByType(type) {
    const all = await this.getAll('debts');
    return all.filter(d => d.type === type);
  }

  async getPaymentsForDebt(debtId) {
    const all = await this.getAll('debtPayments');
    return all.filter(p => p.debtId === debtId).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // --- Seed Initial Categories & Profile ---

  async _seedInitialDefaults() {
    const categories = await this.getAll('categories');
    if (categories.length === 0) {
      const defaultCategories = [
        // Business Income (আয় / বিক্রি)
        { id: 'cat_inc_sales', name: 'দোকানের বিক্রি', type: 'INCOME_BUSINESS', isSales: true, isDefault: true },
        { id: 'cat_inc_service', name: 'সার্ভিস চার্জ', type: 'INCOME_BUSINESS', isSales: false, isDefault: true },
        { id: 'cat_inc_online', name: 'অনলাইন বিক্রি', type: 'INCOME_BUSINESS', isSales: true, isDefault: true },
        { id: 'cat_inc_freelance', name: 'ফ্রিল্যান্সিং', type: 'INCOME_BUSINESS', isSales: false, isDefault: true },
        { id: 'cat_inc_commission', name: 'কমিশন', type: 'INCOME_BUSINESS', isSales: false, isDefault: true },
        { id: 'cat_inc_other_biz', name: 'অন্যান্য ব্যবসায়িক আয়', type: 'INCOME_BUSINESS', isSales: false, isDefault: true },
        { id: 'cat_inc_personal', name: 'ব্যক্তিগত / অন্যান্য আয়', type: 'INCOME_PERSONAL', isSales: false, isDefault: true },

        // Shop Expenses (দোকানের খরচ)
        { id: 'cat_exp_stock', name: 'মাল কেনা', type: 'EXPENSE_SHOP', isDefault: true },
        { id: 'cat_exp_salary', name: 'কর্মচারীর বেতন', type: 'EXPENSE_SHOP', isDefault: true },
        { id: 'cat_exp_rent_shop', name: 'দোকান ভাড়া', type: 'EXPENSE_SHOP', isDefault: true },
        { id: 'cat_exp_elec_shop', name: 'বিদ্যুৎ বিল (দোকান)', type: 'EXPENSE_SHOP', isDefault: true },
        { id: 'cat_exp_transport_shop', name: 'পরিবহন খরচ', type: 'EXPENSE_SHOP', isDefault: true },
        { id: 'cat_exp_net_shop', name: 'ইন্টারনেট বিল', type: 'EXPENSE_SHOP', isDefault: true },
        { id: 'cat_exp_tea_shop', name: 'চা/নাস্তা', type: 'EXPENSE_SHOP', isDefault: true },
        { id: 'cat_exp_repair_shop', name: 'মেরামত', type: 'EXPENSE_SHOP', isDefault: true },
        { id: 'cat_exp_other_shop', name: 'অন্যান্য দোকান খরচ', type: 'EXPENSE_SHOP', isDefault: true },

        // Household Expenses (সংসার খরচ)
        { id: 'cat_exp_bazar', name: 'বাজার', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_rent_house', name: 'বাসা ভাড়া', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_elec_house', name: 'বিদ্যুৎ বিল (বাসা)', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_gas', name: 'গ্যাস বিল', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_water', name: 'পানি বিল', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_med', name: 'চিকিৎসা ও ওষুধ', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_edu', name: 'সন্তানের শিক্ষা', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_trans_house', name: 'যাতায়াত খরচ', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_food', name: 'খাবার', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_mobile', name: 'মোবাইল রিচার্জ', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_net_house', name: 'ইন্টারনেট (বাসা)', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_family', name: 'পারিবারিক প্রয়োজন', type: 'EXPENSE_HOUSE', isDefault: true },
        { id: 'cat_exp_other_house', name: 'অন্যান্য সংসার খরচ', type: 'EXPENSE_HOUSE', isDefault: true }
      ];

      for (const cat of defaultCategories) {
        await this.put('categories', cat);
      }
    }

    // Default Profile (Founder: Rafiqul Islam)
    const profile = await this.get('appProfile', 'main');
    if (!profile || profile.phone === '০১৭১১-০০০০০০' || !profile.businessCategory) {
      await this.put('appProfile', {
        key: 'main',
        businessName: profile?.businessName || 'মেসার্স রফিক স্টোর',
        ownerName: profile?.ownerName || 'রফিকুল ইসলাম',
        tagline: 'দোকান, ব্যবসা ও সংসারের সহজ হিসাব',
        phone: profile?.phone || '0131082-4987',
        address: profile?.address || 'ঢাকা, বাংলাদেশ',
        email: profile?.email || 'rafiqulislam.globalwork@gmail.com',
        currency: 'BDT (৳)',
        photoUrl: 'icons/founder_rafiqul_islam.jpg',
        useBanglaNumerals: true,
        businessCategory: profile?.businessCategory || 'মুদি দোকান ও সুপারশপ',
        activeAccountId: profile?.activeAccountId || 'acc_rafiqul_main'
      });
    }

    // Seed Accounts (Founder & Merchants)
    const accounts = await this.getAll('accounts');
    if (accounts.length === 0) {
      await this.put('accounts', {
        id: 'acc_rafiqul_main',
        businessName: 'মেসার্স রফিক স্টোর',
        ownerName: 'রফিকুল ইসলাম',
        tagline: 'দোকান, ব্যবসা ও সংসারের সহজ হিসাব',
        phone: '0131082-4987',
        email: 'rafiqulislam.globalwork@gmail.com',
        address: 'ঢাকা, বাংলাদেশ',
        pin: '1234',
        role: 'FOUNDER',
        photoUrl: 'icons/founder_rafiqul_islam.jpg',
        isFounder: true,
        businessCategory: 'মুদি দোকান ও সুপারশপ',
        createdAt: new Date().toISOString()
      });

      await this.put('accounts', {
        id: 'acc_demo_store',
        businessName: 'আলমগীর ট্রেডার্স ও ড্রাগ হাউস',
        ownerName: 'মোঃ আলমগীর হোসেন',
        tagline: 'পাইকারি ও খুচরা ওষুধ বিক্রেতা',
        phone: '01712-345678',
        email: 'alamgir.store@gmail.com',
        address: 'মিরপুর, ঢাকা',
        pin: '1234',
        role: 'MERCHANT',
        photoUrl: '',
        isFounder: false,
        businessCategory: 'ফার্মেসি ও ড্রাগ স্টোর',
        createdAt: new Date().toISOString()
      });
    }

    // Default Settings
    const themeSetting = await this.get('settings', 'theme');
    if (!themeSetting) {
      await this.put('settings', { key: 'theme', value: 'light' });
    }

    const pinSetting = await this.get('settings', 'pinLock');
    if (!pinSetting) {
      await this.put('settings', { key: 'pinLock', enabled: false, hash: '' });
    }

    // Default Budgets if none
    const budgets = await this.getAll('budgets');
    if (budgets.length === 0) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await this.put('budgets', {
        id: `bgt_${currentMonth}_shop`,
        month: currentMonth,
        type: 'EXPENSE_SHOP',
        name: 'দোকানের খরচ বাজেট',
        amount: 50000
      });
      await this.put('budgets', {
        id: `bgt_${currentMonth}_house`,
        month: currentMonth,
        type: 'EXPENSE_HOUSE',
        name: 'সংসার খরচ বাজেট',
        amount: 30000
      });
    }

    // Check if we should seed starter demo entries for immediate wow effect
    const txList = await this.getAll('transactions');
    if (txList.length === 0) {
      await this.seedSampleData();
    }

    // Seed Financial Accounts (Cash, Bank, Mobile Banking)
    const finAccounts = await this.getAll('financialAccounts');
    if (finAccounts.length === 0) {
      const defaultFinAccounts = [
        { id: 'acc_cash', name: 'নগদ ক্যাশ (Cash in Hand)', type: 'CASH', icon: '💵', balance: 45000, isDefault: true, accountId: 'acc_rafiqul_main' },
        { id: 'acc_bank', name: 'ব্যাংক হিসাব (Main Bank)', type: 'BANK', icon: '🏛️', balance: 80000, bankName: 'সোনালী ব্যাংক পিএলসি', isDefault: false, accountId: 'acc_rafiqul_main' },
        { id: 'acc_bkash', name: 'বিকাশ ওয়ালেট (bKash)', type: 'MOBILE_BANKING', icon: '📱', balance: 15000, isDefault: false, accountId: 'acc_rafiqul_main' },
        { id: 'acc_nagad', name: 'নগদ ওয়ালেট (Nagad)', type: 'MOBILE_BANKING', icon: '📲', balance: 10000, isDefault: false, accountId: 'acc_rafiqul_main' },
        { id: 'acc_rocket', name: 'রকেট ওয়ালেট (Rocket)', type: 'MOBILE_BANKING', icon: '🚀', balance: 0, isDefault: false, accountId: 'acc_rafiqul_main' }
      ];
      for (const a of defaultFinAccounts) {
        await this.put('financialAccounts', a);
      }
    }

    // Auto-migrate Customers & Suppliers from Debts if stores are empty
    const customers = await this.getAll('customers');
    const debts = await this.getAll('debts');
    if (customers.length === 0 && debts.length > 0) {
      const custMap = {};
      const suppMap = {};
      for (const d of debts) {
        const name = (d.person || '').trim();
        if (!name) continue;
        if (d.type === 'RECEIVABLE' && !custMap[name.toLowerCase()]) {
          custMap[name.toLowerCase()] = {
            id: Utils.generateId('cust'),
            name: name,
            phone: d.phone || '',
            address: '',
            totalSales: Number(d.amount) || 0,
            totalPaid: Number(d.paidAmount) || 0,
            currentDue: Number(d.remainingAmount !== undefined ? d.remainingAmount : (d.amount - (d.paidAmount || 0))) || 0,
            dueDate: d.dueDate || '',
            note: d.note || '',
            accountId: d.accountId || 'acc_rafiqul_main',
            createdAt: d.createdAt || new Date().toISOString()
          };
        } else if (d.type === 'PAYABLE' && !suppMap[name.toLowerCase()]) {
          suppMap[name.toLowerCase()] = {
            id: Utils.generateId('supp'),
            name: name,
            phone: d.phone || '',
            address: '',
            totalPurchase: Number(d.amount) || 0,
            totalPaid: Number(d.paidAmount) || 0,
            currentPayable: Number(d.remainingAmount !== undefined ? d.remainingAmount : (d.amount - (d.paidAmount || 0))) || 0,
            dueDate: d.dueDate || '',
            note: d.note || '',
            accountId: d.accountId || 'acc_rafiqul_main',
            createdAt: d.createdAt || new Date().toISOString()
          };
        }
      }
      for (const c of Object.values(custMap)) {
        await this.put('customers', c);
      }
      for (const s of Object.values(suppMap)) {
        await this.put('suppliers', s);
      }
    }
  }

  /**
   * Seed realistic sample transactions, debts, and saving goals
   */
  async seedSampleData() {
    const today = Utils.getTodayDateString();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = Utils.toInputDate(d);
    d.setDate(d.getDate() - 2);
    const twoDaysAgo = Utils.toInputDate(d);

    // 1. Transactions
    const sampleTx = [
      // Today
      {
        id: Utils.generateId('tx'),
        type: 'INCOME',
        amount: 14500,
        category: 'cat_inc_sales',
        categoryName: 'দোকানের বিক্রি',
        date: today,
        paymentMethod: 'Cash',
        description: 'সকালের নগদ বিক্রি',
        person: 'কাউন্টার ক্যাশ',
        refNo: 'VCH-01',
        isSales: true
      },
      {
        id: Utils.generateId('tx'),
        type: 'INCOME',
        amount: 3500,
        category: 'cat_inc_online',
        categoryName: 'অনলাইন বিক্রি',
        date: today,
        paymentMethod: 'bKash',
        description: 'অনলাইন অর্ডার পার্সেল ডেলিভারি',
        person: 'কাস্টমার শাকিল',
        refNo: 'BK-9921',
        isSales: true
      },
      {
        id: Utils.generateId('tx'),
        type: 'EXPENSE',
        expenseType: 'EXPENSE_SHOP',
        amount: 3200,
        category: 'cat_exp_stock',
        categoryName: 'মাল কেনা',
        date: today,
        paymentMethod: 'Cash',
        description: 'হোলসেল মার্কেট থেকে নতুন মাল আনা',
        person: 'মেসার্স ভাই ভাই ট্রেডার্স',
        refNo: 'INV-401'
      },
      {
        id: Utils.generateId('tx'),
        type: 'EXPENSE',
        expenseType: 'EXPENSE_SHOP',
        amount: 250,
        category: 'cat_exp_tea_shop',
        categoryName: 'চা/নাস্তা',
        date: today,
        paymentMethod: 'Cash',
        description: 'দোকানের অতিথি আপ্যায়ন ও চা',
        person: '',
        refNo: ''
      },
      {
        id: Utils.generateId('tx'),
        type: 'EXPENSE',
        expenseType: 'EXPENSE_HOUSE',
        amount: 1800,
        category: 'cat_exp_bazar',
        categoryName: 'বাজার',
        date: today,
        paymentMethod: 'Cash',
        description: 'সকালের কাঁচাবাজার ও মাছ কেনা',
        person: '',
        refNo: ''
      },

      // Yesterday
      {
        id: Utils.generateId('tx'),
        type: 'INCOME',
        amount: 16800,
        category: 'cat_inc_sales',
        categoryName: 'দোকানের বিক্রি',
        date: yesterday,
        paymentMethod: 'Cash',
        description: 'সারাদিনের খুচরা বিক্রি',
        person: 'কাউন্টার',
        isSales: true
      },
      {
        id: Utils.generateId('tx'),
        type: 'EXPENSE',
        expenseType: 'EXPENSE_SHOP',
        amount: 2400,
        category: 'cat_exp_transport_shop',
        categoryName: 'পরিবহন খরচ',
        date: yesterday,
        paymentMethod: 'Cash',
        description: 'ভ্যান ভাড়া ও মালামাল খালাস',
        person: 'করিম ড্রাইভার'
      },
      {
        id: Utils.generateId('tx'),
        type: 'EXPENSE',
        expenseType: 'EXPENSE_HOUSE',
        amount: 1200,
        category: 'cat_exp_med',
        categoryName: 'চিকিৎসা ও ওষুধ',
        date: yesterday,
        paymentMethod: 'Nagad',
        description: 'পরিবারের ফার্মেসির ওষুধ',
        person: ''
      },

      // Two days ago
      {
        id: Utils.generateId('tx'),
        type: 'INCOME',
        amount: 18500,
        category: 'cat_inc_sales',
        categoryName: 'দোকানের বিক্রি',
        date: twoDaysAgo,
        paymentMethod: 'Cash',
        description: 'মোট বিক্রি',
        person: '',
        isSales: true
      },
      {
        id: Utils.generateId('tx'),
        type: 'EXPENSE',
        expenseType: 'EXPENSE_SHOP',
        amount: 5000,
        category: 'cat_exp_salary',
        categoryName: 'কর্মচারীর বেতন',
        date: twoDaysAgo,
        paymentMethod: 'Bank',
        description: 'কর্মচারী সুমনের মাসিক অগ্রিম বেতন',
        person: 'সুমন আহমেদ'
      },
      {
        id: Utils.generateId('tx'),
        type: 'EXPENSE',
        expenseType: 'EXPENSE_HOUSE',
        amount: 2500,
        category: 'cat_exp_edu',
        categoryName: 'সন্তানের শিক্ষা',
        date: twoDaysAgo,
        paymentMethod: 'bKash',
        description: 'স্কুল ফি ও খাতা-কলম',
        person: ''
      }
    ];

    for (const t of sampleTx) {
      await this.put('transactions', t);
    }

    // 2. Debts (ধার-বাকি)
    const debt1Id = Utils.generateId('dbt');
    const debt2Id = Utils.generateId('dbt');

    // আমি পাব (Receivable)
    await this.put('debts', {
      id: debt1Id,
      type: 'RECEIVABLE', // আমি পাব
      person: 'আনোয়ার হোসেন',
      phone: '01712-345678',
      amount: 10000,
      paidAmount: 4000,
      remainingAmount: 6000,
      date: yesterday,
      dueDate: Utils.toInputDate(new Date(Date.now() + 7 * 86400000)),
      note: 'বাকিতে পাইকারি পণ্য নিয়েছে',
      status: 'PARTIAL'
    });

    // Payment history for debt1
    await this.put('debtPayments', {
      id: Utils.generateId('pmt'),
      debtId: debt1Id,
      person: 'আনোয়ার হোসেন',
      amount: 4000,
      date: today,
      paymentMethod: 'bKash',
      note: 'বিকাশে প্রথম কিস্তির ৪,০০০ টাকা জমা দিয়েছে'
    });

    // আমি দেব (Payable)
    await this.put('debts', {
      id: debt2Id,
      type: 'PAYABLE', // আমি দেব
      person: 'মেসার্স সিটি সাপ্লায়ার্স',
      phone: '01819-876543',
      amount: 25000,
      paidAmount: 10000,
      remainingAmount: 15000,
      date: twoDaysAgo,
      dueDate: Utils.toInputDate(new Date(Date.now() + 14 * 86400000)),
      note: 'ডিলার থেকে বাকিতে মালামাল সরবরাহ',
      status: 'PARTIAL'
    });

    await this.put('debtPayments', {
      id: Utils.generateId('pmt'),
      debtId: debt2Id,
      person: 'মেসার্স সিটি সাপ্লায়ার্স',
      amount: 10000,
      date: yesterday,
      paymentMethod: 'Bank',
      note: 'ব্যাংক চেকের মাধ্যমে আংশিক পরিশোধ'
    });

    // 3. Saving Goals
    await this.put('savingGoals', {
      id: Utils.generateId('goal'),
      title: 'নতুন কম্পিউটার ও প্রিন্টার',
      targetAmount: 80000,
      savedAmount: 25000,
      remainingAmount: 55000,
      progressPercent: 31.25,
      targetDate: Utils.toInputDate(new Date(Date.now() + 90 * 86400000)),
      status: 'ACTIVE',
      color: '#146C43'
    });

    await this.put('savingGoals', {
      id: Utils.generateId('goal'),
      title: 'দোকান ডেকোরেশন ও নতুন রেক',
      targetAmount: 50000,
      savedAmount: 35000,
      remainingAmount: 15000,
      progressPercent: 70.0,
      targetDate: Utils.toInputDate(new Date(Date.now() + 45 * 86400000)),
      status: 'ACTIVE',
      color: '#B8860B'
    });

    // 5. Products & Inventory (পণ্য ও স্টক)
    const existingProducts = await this.getAll('products');
    if (!existingProducts || existingProducts.length === 0) {
      const sampleProducts = [
        // Grocery Products (Rafiq Store - মুদি দোকান ও সুপারশপ)
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_rafiqul_main',
          name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)',
          category: 'ভোজ্যতেল ও ঘি',
          code: 'OIL-5L-RUP',
          unit: 'বোতল',
          buyingPrice: 810,
          sellingPrice: 870,
          currentStock: 25,
          minStockAlert: 5,
          buyPrice: 810,
          sellPrice: 870,
          stockQty: 25,
          lowStockAlert: 5,
          description: 'খাঁটি পরিশোধিত সয়াবিন তেল'
        },
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_rafiqul_main',
          name: 'মিনিকেট চাল (৫০ কেজি বস্তা)',
          category: 'চাল-ডাল ও আটা',
          code: 'RICE-MINI-50K',
          unit: 'বস্তা',
          buyingPrice: 3200,
          sellingPrice: 3450,
          currentStock: 18,
          minStockAlert: 4,
          buyPrice: 3200,
          sellPrice: 3450,
          stockQty: 18,
          lowStockAlert: 4,
          description: 'চিকন প্রিমিয়াম মিনিকেট চাল'
        },
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_rafiqul_main',
          name: 'সাদা চিনি (কেজি)',
          category: 'চিনি ও লবণ',
          code: 'SUGAR-1KG',
          unit: 'কেজি',
          buyingPrice: 125,
          sellingPrice: 135,
          currentStock: 80,
          minStockAlert: 15,
          buyPrice: 125,
          sellPrice: 135,
          stockQty: 80,
          lowStockAlert: 15,
          description: 'দেশি পরিশোধিত চিনি'
        },
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_rafiqul_main',
          name: 'দেশি মসুর ডাল (কেজি)',
          category: 'চাল-ডাল ও আটা',
          code: 'LENTIL-1KG',
          unit: 'কেজি',
          buyingPrice: 130,
          sellingPrice: 145,
          currentStock: 45,
          minStockAlert: 10,
          buyPrice: 130,
          sellPrice: 145,
          stockQty: 45,
          lowStockAlert: 10,
          description: 'ছোট দানার দেশি মসুর ডাল'
        },
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_rafiqul_main',
          name: 'লাক্স সাবান (১০০ গ্রাম)',
          category: 'সাবান ও টয়লেট্রিজ',
          code: 'SOAP-LUX-100',
          unit: 'পিস',
          buyingPrice: 48,
          sellingPrice: 55,
          currentStock: 60,
          minStockAlert: 10,
          buyPrice: 48,
          sellPrice: 55,
          stockQty: 60,
          lowStockAlert: 10,
          description: 'বিউটি বার সাবান'
        },

        // Pharmacy Products (Alamgir Traders - ফার্মেসি ও ড্রাগ স্টোর)
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_demo_store',
          name: 'নাপা এক্সট্রা ট্যাবলেট (বক্স)',
          category: 'ট্যাবলেট ও ক্যাপসুল',
          code: 'NAPA-EXT-BOX',
          unit: 'বক্স',
          buyingPrice: 220,
          sellingPrice: 250,
          currentStock: 35,
          minStockAlert: 5,
          buyPrice: 220,
          sellPrice: 250,
          stockQty: 35,
          lowStockAlert: 5,
          description: 'প্যারাসিটামল + ক্যাফেইন ৫০০মি.গ্রা.+৬৫মি.গ্রা.'
        },
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_demo_store',
          name: 'সেক্লো ২০ মি.গ্রা. ক্যাপসুল (বক্স)',
          category: 'ট্যাবলেট ও ক্যাপসুল',
          code: 'SECLO-20-BOX',
          unit: 'বক্স',
          buyingPrice: 410,
          sellingPrice: 460,
          currentStock: 20,
          minStockAlert: 4,
          buyPrice: 410,
          sellPrice: 460,
          stockQty: 20,
          lowStockAlert: 4,
          description: 'ওমিপ্রাজল ২০ মি.গ্রা. গ্যাস্ট্রিক ক্যাপসুল'
        },
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_demo_store',
          name: 'প্যারাসিটামল সাসপেনশন সিরাপ (৬০ মি.লি.)',
          category: 'সিরাপ ও সাসপেনশন',
          code: 'PARA-SYP-60ML',
          unit: 'বোতল',
          buyingPrice: 28,
          sellingPrice: 35,
          currentStock: 40,
          minStockAlert: 8,
          buyPrice: 28,
          sellPrice: 35,
          stockQty: 40,
          lowStockAlert: 8,
          description: 'শিশুদের জ্বর ও ব্যথানাশক সিরাপ'
        },
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_demo_store',
          name: 'স্যাভলন অ্যান্টিসেপটিক লিকুইড (১০০ মি.লি.)',
          category: 'সার্জিক্যাল ও ফার্স্ট এইড',
          code: 'SAVLON-100ML',
          unit: 'বোতল',
          buyingPrice: 52,
          sellingPrice: 60,
          currentStock: 30,
          minStockAlert: 6,
          buyPrice: 52,
          sellPrice: 60,
          stockQty: 30,
          lowStockAlert: 6,
          description: 'জীবাণুনাশক ফার্স্ট এইড লিকুইড'
        },
        {
          id: Utils.generateId('prod'),
          accountId: 'acc_demo_store',
          name: 'মাইক্রোপোর সার্জিক্যাল টেপ (১ ইঞ্চি)',
          category: 'সার্জিক্যাল ও ফার্স্ট এইড',
          code: 'MICRO-TAPE-1IN',
          unit: 'পিস',
          buyingPrice: 75,
          sellingPrice: 90,
          currentStock: 22,
          minStockAlert: 5,
          buyPrice: 75,
          sellPrice: 90,
          stockQty: 22,
          lowStockAlert: 5,
          description: 'মেডিকেল ড্রেসিং পেপার টেপ'
        }
      ];

      for (const p of sampleProducts) {
        await this.put('products', p);
      }
    }

    console.log('[IndexedDB] Starter sample data seeded successfully.');
  }

  /**
   * Export all data for backup (All 20 stores)
   */
  async exportCompleteDatabase() {
    const stores = [
      'transactions', 'categories', 'debts', 'debtPayments', 'budgets', 'savingGoals',
      'settings', 'appProfile', 'accounts', 'products', 'dailyClosings',
      'sales', 'saleItems', 'purchases', 'purchaseItems', 'customers', 'suppliers',
      'stockMovements', 'financialAccounts', 'auditLogs'
    ];
    const backup = {
      appName: 'RI Family & Business Hisab',
      version: '5.0',
      exportedAt: new Date().toISOString(),
      stores: {}
    };

    for (const s of stores) {
      if (this.db.objectStoreNames.contains(s)) {
        backup.stores[s] = await this.getAll(s);
      }
    }
    return backup;
  }

  /**
   * Restore database from backup object safely
   */
  async restoreCompleteDatabase(backupObj) {
    if (!backupObj || !backupObj.stores) {
      throw new Error('অবৈধ ব্যাকআপ ফাইল');
    }

    const stores = Object.keys(backupObj.stores);
    for (const storeName of stores) {
      if (this.db.objectStoreNames.contains(storeName)) {
        await this.clear(storeName);
        const records = backupObj.stores[storeName];
        if (Array.isArray(records)) {
          for (const item of records) {
            await this.put(storeName, item);
          }
        }
      }
    }
    return true;
  }

  /**
   * Log system/user activity to audit trail
   */
  async logAudit(action, description, recordId = null, user = 'রফিকুল ইসলাম') {
    try {
      if (!this.db || !this.db.objectStoreNames.contains('auditLogs')) return;
      await this.put('auditLogs', {
        id: Utils.generateId('log'),
        date: new Date().toISOString(),
        action,
        description,
        recordId,
        user
      });
    } catch (e) {
      console.warn('Audit log write error:', e);
    }
  }

  /**
   * Record immutable stock movement
   */
  async recordStockMovement({ productId, productName, type, qty, previousStock, newStock, unitPrice = 0, refType = '', refId = '', note = '', accountId = 'acc_rafiqul_main' }) {
    try {
      if (!this.db || !this.db.objectStoreNames.contains('stockMovements')) return;
      await this.put('stockMovements', {
        id: Utils.generateId('sm'),
        productId,
        productName,
        type, // 'SALE', 'PURCHASE', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'
        qty: Number(qty) || 0,
        previousStock: Number(previousStock) || 0,
        newStock: Number(newStock) || 0,
        unitPrice: Number(unitPrice) || 0,
        refType,
        refId,
        note,
        accountId,
        date: Utils.getTodayDateString(),
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Stock movement record error:', e);
    }
  }

  /**
   * Reset all user records to empty or re-seed
   */
  async resetDatabase(seedDefaults = true) {
    const stores = [
      'transactions', 'debts', 'debtPayments', 'budgets', 'savingGoals', 'products', 'dailyClosings',
      'sales', 'saleItems', 'purchases', 'purchaseItems', 'customers', 'suppliers', 'stockMovements', 'auditLogs'
    ];
    for (const s of stores) {
      if (this.db.objectStoreNames.contains(s)) {
        await this.clear(s);
      }
    }
    if (seedDefaults) {
      await this.seedSampleData();
    }
  }
}

window.khataDB = new KhataDatabase();

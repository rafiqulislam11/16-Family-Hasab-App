/**
 * খাতা — Utility Functions & Helpers
 * Bangla Numerals, Currency, Date Formatter, Smart Calculator Parser, UTF-8 CSV Exporter, WebCrypto
 */

const Utils = {
  banglaDigits: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
  englishDigits: {'০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'},

  banglaMonths: [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ],

  banglaDays: [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ],

  /**
   * Convert numbers / strings to Bangla Numerals with comma formatting
   */
  toBanglaNumber(val, useCommas = true) {
    if (val === null || val === undefined || isNaN(Number(val))) return '০';
    let num = Number(val);
    let isNeg = num < 0;
    num = Math.abs(num);

    let parts = num.toFixed(2).split('.');
    let intPart = parts[0];
    let decPart = parts[1] === '00' ? '' : '.' + parts[1];

    if (useCommas) {
      // South Asian numbering system: 3 digits, then groups of 2 digits (e.g., 12,34,567)
      let lastThree = intPart.substring(intPart.length - 3);
      let otherNumbers = intPart.substring(0, intPart.length - 3);
      if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
      }
      intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    }

    let result = intPart + decPart;
    let bnStr = result.replace(/\d/g, (d) => this.banglaDigits[d]);
    return isNeg ? '-' + bnStr : bnStr;
  },

  /**
   * Convert Bengali numerals string to English number string
   */
  toEnglishDigits(str) {
    if (!str) return '';
    return str.toString().replace(/[০-৯]/g, (d) => this.englishDigits[d] || d);
  },

  /**
   * Format Currency with ৳ symbol
   */
  formatCurrency(val, showSymbol = true) {
    const formatted = this.toBanglaNumber(val);
    return showSymbol ? `৳ ${formatted}` : formatted;
  },

  /**
   * Format Date string (YYYY-MM-DD) into Bengali representation
   */
  formatDateBengali(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = this.toBanglaNumber(date.getDate(), false);
    const month = this.banglaMonths[date.getMonth()];
    const year = this.toBanglaNumber(date.getFullYear(), false);

    return `${day} ${month} ${year}`;
  },

  /**
   * Get Bengali day name (e.g. শুক্রবার)
   */
  getDayNameBengali(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return this.banglaDays[date.getDay()];
  },

  /**
   * Friendly relative date (আজ, গতকাল, etc.)
   */
  getRelativeDateBengali(dateStr) {
    if (!dateStr) return '';
    const today = this.getTodayDateString();
    if (dateStr === today) return 'আজ';

    const d = new Date(dateStr);
    const now = new Date(today);
    const diffDays = Math.round((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'গতকাল';
    if (diffDays === 2) return '২ দিন আগে';
    if (diffDays === -1) return 'আগামীকাল';

    return this.formatDateBengali(dateStr);
  },

  /**
   * Returns current date in YYYY-MM-DD
   */
  getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Format ISO date string into YYYY-MM-DD
   */
  toInputDate(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Smart Arithmetic Calculator Expression Parser
   * Evaluates math expressions like "100+200", "500-100", "20*50", "1000/4" safely without eval()
   * Supports Bangla or English numerals.
   */
  parseSmartAmount(expression) {
    if (expression === null || expression === undefined) return { valid: false, value: 0 };
    let clean = this.toEnglishDigits(expression.toString()).trim();
    if (!clean) return { valid: false, value: 0 };

    // Remove allowed currency symbols or commas
    clean = clean.replace(/৳|,/g, '').trim();

    // Check if input only contains allowed characters: digits, ., +, -, *, /, (, ), spaces
    if (!/^[0-9+\-*/().\s]+$/.test(clean)) {
      return { valid: false, value: 0, error: 'অবৈধ অক্ষর রয়েছে' };
    }

    try {
      // Safe arithmetic evaluator using tokenization and shunting-yard algorithm
      const result = this._safeCalculate(clean);
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return { valid: true, value: Math.round(result * 100) / 100, expression: clean };
      }
      return { valid: false, value: 0, error: 'হিসাব সঠিক নয়' };
    } catch (e) {
      return { valid: false, value: 0, error: 'ভুল সমীকরণ' };
    }
  },

  _safeCalculate(expr) {
    // Simple recursive descent / shunting yard for standard operators: +, -, *, /
    const tokens = expr.match(/(\d+\.?\d*|\+|\-|\*|\/|\(|\))/g);
    if (!tokens) return 0;

    let index = 0;

    function parseExpression() {
      let val = parseTerm();
      while (index < tokens.length) {
        let op = tokens[index];
        if (op === '+' || op === '-') {
          index++;
          let nextVal = parseTerm();
          if (op === '+') val += nextVal;
          else val -= nextVal;
        } else {
          break;
        }
      }
      return val;
    }

    function parseTerm() {
      let val = parseFactor();
      while (index < tokens.length) {
        let op = tokens[index];
        if (op === '*' || op === '/') {
          index++;
          let nextVal = parseFactor();
          if (op === '*') val *= nextVal;
          else {
            if (nextVal === 0) throw new Error('Divide by zero');
            val /= nextVal;
          }
        } else {
          break;
        }
      }
      return val;
    }

    function parseFactor() {
      if (index >= tokens.length) return 0;
      let token = tokens[index];

      if (token === '(') {
        index++;
        let val = parseExpression();
        if (tokens[index] === ')') index++;
        return val;
      } else if (token === '-') {
        index++;
        return -parseFactor();
      } else if (token === '+') {
        index++;
        return parseFactor();
      } else {
        index++;
        return parseFloat(token);
      }
    }

    return parseExpression();
  },

  /**
   * Unique ID Generator
   */
  generateId(prefix = 'kht') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  },

  /**
   * SHA-256 Hash for Security PIN using Web Crypto API
   */
  async hashPin(pin) {
    if (!pin) return '';
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + '_khata_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Excel-compatible CSV Exporter with UTF-8 BOM (\uFEFF)
   * Ensures Bengali characters appear flawlessly in Microsoft Excel
   */
  exportToCSV(headers, rows, filename = 'khata_data.csv') {
    const processRow = (row) => {
      return row.map(val => {
        let str = (val === null || val === undefined) ? '' : String(val);
        str = str.replace(/"/g, '""');
        if (str.search(/("|,|\n)/g) >= 0) {
          str = `"${str}"`;
        }
        return str;
      }).join(',');
    };

    let csvContent = '\uFEFF'; // BOM
    csvContent += processRow(headers) + '\r\n';

    rows.forEach(r => {
      csvContent += processRow(r) + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Download JSON file
   */
  downloadJSON(data, filename = 'khata_backup.json') {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Debounce helper
   */
  debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Convert number to Bengali Words for Memos and Vouchers
   */
  numberToBanglaWords(num) {
    if (!num || isNaN(num) || num <= 0) return 'শূন্য টাকা মাত্র';
    num = Math.floor(Math.abs(num));

    const ones = [
      '', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
      'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ',
      'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'উনত্রিশ',
      'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'উনচল্লিশ',
      'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'উনপঞ্চাশ',
      'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'উনষাট',
      'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'উনসত্তর',
      'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চৌহাত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'উনআশি',
      'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'উননব্বই',
      'নব্বই', 'একানব্বই', 'বানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'
    ];

    const convertHundreds = (n) => {
      let str = '';
      if (n >= 100) {
        str += ones[Math.floor(n / 100)] + ' শত ';
        n %= 100;
      }
      if (n > 0) {
        str += ones[n] + ' ';
      }
      return str.trim();
    };

    let crore = Math.floor(num / 10000000);
    num %= 10000000;
    let lakh = Math.floor(num / 100000);
    num %= 100000;
    let thousand = Math.floor(num / 1000);
    num %= 1000;
    let remainder = num;

    let res = '';
    if (crore > 0) res += convertHundreds(crore) + ' কোটি ';
    if (lakh > 0) res += convertHundreds(lakh) + ' লাখ ';
    if (thousand > 0) res += convertHundreds(thousand) + ' হাজার ';
    if (remainder > 0) res += convertHundreds(remainder) + ' ';

    return (res.trim() + ' টাকা মাত্র');
  },

  /**
   * Centralized Language & i18n Support (বাংলা & English)
   */
  currentLang: 'bn',

  translations: {
    bn: {
      appName: 'RI Family & Business Hisab',
      tagline: 'ব্যবসা ও সংসারের হিসাব—সব এক জায়গায়।',
      dashboard: 'ড্যাশবোর্ড',
      transactions: 'লেনদেন খতিয়ান',
      debts: 'ধার-বাকি খাতা',
      products: 'পণ্য ও স্টক খাতা',
      reports: 'রিপোর্ট ও এনালাইটিক্স',
      budget: 'মাসিক বাজেট',
      savings: 'সঞ্চয় লক্ষ্য',
      settings: 'সেটিংস ও প্রোফাইল',
      sales: 'বিক্রি (POS)',
      purchases: 'ক্রয় ও মহাজন',
      customers: 'কাস্টমার তালিকা',
      suppliers: 'সাপ্লায়ার / মহাজন',
      cashBank: 'ক্যাশ ও ব্যাংক',
      dailyClosing: 'দৈনিক ক্যাশ ক্লোজিং',
      quickAdd: 'দ্রুত হিসাব যোগ',
      totalBalance: 'মোট ব্যালেন্স',
      cashInHand: 'ক্যাশ ইন হ্যান্ড',
      bankBalance: 'ব্যাংক ব্যালেন্স',
      todaySales: 'আজকের বিক্রি',
      todayExpenses: 'আজকের খরচ',
      todayProfit: 'আজকের লাভ',
      save: 'সংরক্ষণ করুন',
      cancel: 'বাতিল',
      delete: 'মুছে ফেলুন',
      undo: 'পূর্বাবস্থায় আনুন',
      edit: 'সম্পাদনা',
      print: 'প্রিন্ট করুন',
      download: 'ডাউনলোড'
    },
    en: {
      appName: 'RI Family & Business Hisab',
      tagline: 'Business & Household Accounts in One Place.',
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      debts: 'Due & Credit Ledger',
      products: 'Products & Inventory',
      reports: 'Reports & Analytics',
      budget: 'Monthly Budget',
      savings: 'Saving Goals',
      settings: 'Settings & Profile',
      sales: 'Sales (POS)',
      purchases: 'Purchases',
      customers: 'Customers',
      suppliers: 'Suppliers',
      cashBank: 'Cash & Bank',
      dailyClosing: 'Daily Cash Closing',
      quickAdd: 'Quick Add',
      totalBalance: 'Total Balance',
      cashInHand: 'Cash in Hand',
      bankBalance: 'Bank Balance',
      todaySales: "Today's Sales",
      todayExpenses: "Today's Expenses",
      todayProfit: "Today's Profit",
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      undo: 'Undo',
      edit: 'Edit',
      print: 'Print',
      download: 'Download'
    }
  },

  t(key, fallback = '') {
    const lang = this.currentLang || 'bn';
    const dict = this.translations[lang] || this.translations.bn;
    return dict[key] || fallback || key;
  },

  setLanguage(lang = 'bn') {
    this.currentLang = (lang === 'en') ? 'en' : 'bn';
    try {
      localStorage.setItem('ri_hisab_lang', this.currentLang);
    } catch (e) {}
  },

  /**
   * Validate full JSON backup file before restoring
   */
  validateBackupObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return { valid: false, error: 'অবৈধ ফাইল ফরম্যাট!' };
    }
    if (!obj.stores || typeof obj.stores !== 'object') {
      return { valid: false, error: 'ব্যাকআপে কোনো ডাটা স্টোর পাওয়া যায়নি!' };
    }
    const storeCount = Object.keys(obj.stores).length;
    if (storeCount === 0) {
      return { valid: false, error: 'ব্যাকআপ ফাইলটি সম্পূর্ণ খালি!' };
    }
    return { valid: true, storeCount, exportedAt: obj.exportedAt };
  },

  /**
   * Generate SKU / Barcode text
   */
  generateSKU(prefix = 'RI', name = '') {
    const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4) || 'RI';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${cleanPrefix}-${Date.now().toString().slice(-4)}-${rand}`;
  }
};

window.Utils = Utils;

/**
 * খাতা — UI Components Helpers
 * Toasts, Modals, Confirm Dialogs, PIN Security Overlay, Print Voucher Builder
 */

const UI = {
  /**
   * Toast Notifications
   */
  toast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `khata-toast toast-${type}`;

    let icon = '✓';
    if (type === 'error') icon = '✕';
    else if (type === 'warning') icon = '⚠';
    else if (type === 'info') icon = 'ℹ';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  },

  /**
   * Confirmation Modal Dialog
   */
  confirm({ title, message, confirmText = 'মুছে ফেলুন', cancelText = 'বাতিল', isDanger = true, onConfirm }) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;

    document.getElementById('confirmModalTitle').textContent = title || 'নিশ্চিত করুন';
    document.getElementById('confirmModalMsg').textContent = message || 'আপনি কি নিশ্চিত?';
    
    const confirmBtn = document.getElementById('confirmModalActionBtn');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';

    const cancelBtn = document.getElementById('confirmModalCancelBtn');
    cancelBtn.textContent = cancelText;

    const cleanup = () => {
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      UI.closeModal('confirmModal');
    };

    confirmBtn.onclick = () => {
      cleanup();
      if (typeof onConfirm === 'function') onConfirm();
    };

    cancelBtn.onclick = () => {
      cleanup();
    };

    UI.openModal('confirmModal');
  },

  /**
   * Open Modal by ID
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    // Auto-focus first input if any
    const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  },

  /**
   * Close Modal by ID
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');

    // If no other modal is active, remove modal-open from body
    if (!document.querySelector('.khata-modal.active')) {
      document.body.classList.remove('modal-open');
    }
  },

  /**
   * Close all active modals
   */
  closeAllModals() {
    document.querySelectorAll('.khata-modal.active').forEach(m => m.classList.remove('active'));
    document.body.classList.remove('modal-open');
  },

  /**
   * PIN Lock Keypad Controller
   */
  pinPad: {
    enteredDigits: '',
    expectedHash: '',
    mode: 'UNLOCK', // UNLOCK, SET, or CONFIRM_NEW
    tempNewPin: '',

    init(expectedHash = '') {
      this.expectedHash = expectedHash;
      this.enteredDigits = '';
      this.updateDots();
    },

    press(digit) {
      if (this.enteredDigits.length >= 4) return;
      this.enteredDigits += digit;
      this.updateDots();

      if (this.enteredDigits.length === 4) {
        setTimeout(() => this.handleSubmit(), 150);
      }
    },

    backspace() {
      if (this.enteredDigits.length > 0) {
        this.enteredDigits = this.enteredDigits.slice(0, -1);
        this.updateDots();
      }
    },

    clear() {
      this.enteredDigits = '';
      this.updateDots();
    },

    updateDots() {
      const dots = document.querySelectorAll('.pin-dot');
      dots.forEach((dot, index) => {
        if (index < this.enteredDigits.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });
    },

    async handleSubmit() {
      const hash = await Utils.hashPin(this.enteredDigits);
      if (hash === this.expectedHash) {
        // Unlock successful!
        const overlay = document.getElementById('pinLockOverlay');
        if (overlay) overlay.classList.remove('active');
        this.enteredDigits = '';
        this.updateDots();
        UI.toast('অ্যাপ আনলক হয়েছে ✓', 'success', 2000);
      } else {
        // Incorrect PIN
        const dotsBox = document.querySelector('.pin-dots-container');
        if (dotsBox) {
          dotsBox.classList.add('shake');
          setTimeout(() => dotsBox.classList.remove('shake'), 500);
        }
        UI.toast('ভুল পিন কোড! আবার চেষ্টা করুন', 'error', 2500);
        this.clear();
      }
    }
  },

  /**
   * Print Voucher / Statement Builder
   */
  printReport({ title, subtitle, dateRange, profile, items = [], totals = {}, type = 'TRANSACTION' }) {
    const printArea = document.getElementById('printableArea');
    if (!printArea) return;

    let rowsHtml = '';

    if (type === 'TRANSACTION') {
      items.forEach((item, idx) => {
        const isInc = item.type === 'INCOME';
        const typeBadge = isInc ? 'আয় / বিক্রি' : (item.expenseType === 'EXPENSE_SHOP' ? 'দোকান খরচ' : 'সংসার খরচ');
        rowsHtml += `
          <tr>
            <td style="text-align: center;">${Utils.toBanglaNumber(idx + 1, false)}</td>
            <td>${Utils.formatDateBengali(item.date)}</td>
            <td><strong>${item.categoryName || item.category || ''}</strong><br><small style="color: #666;">${item.description || ''}</small></td>
            <td>${typeBadge}</td>
            <td>${item.paymentMethod || 'নগদ'}</td>
            <td style="text-align: right; font-weight: bold; color: ${isInc ? '#059669' : '#DC2626'};">
              ${isInc ? '+' : '-'} ${Utils.formatCurrency(item.amount)}
            </td>
          </tr>
        `;
      });
    } else if (type === 'DEBT') {
      items.forEach((d, idx) => {
        const isRec = d.type === 'RECEIVABLE';
        rowsHtml += `
          <tr>
            <td style="text-align: center;">${Utils.toBanglaNumber(idx + 1, false)}</td>
            <td><strong>${d.person}</strong><br><small style="color: #666;">${d.phone || ''}</small></td>
            <td>${isRec ? 'আমি পাব (কাস্টমার বাকি)' : 'আমি দেব (মহাজন বাকি)'}</td>
            <td style="text-align: right;">${Utils.formatCurrency(d.amount)}</td>
            <td style="text-align: right; color: #059669;">${Utils.formatCurrency(d.paidAmount || 0)}</td>
            <td style="text-align: right; font-weight: bold; color: #DC2626;">${Utils.formatCurrency(d.remainingAmount || 0)}</td>
          </tr>
        `;
      });
    }

    printArea.innerHTML = `
      <div class="print-voucher">
        <div class="print-header">
          <div class="print-shop-name">${profile.businessName || 'সহজ খাতা'}</div>
          <div class="print-shop-owner">প্রোপ্রাইটর: ${profile.ownerName || ''}</div>
          <div class="print-shop-contact">${profile.address || ''} | মোবাইল: ${profile.phone || ''}</div>
        </div>

        <div class="print-divider"></div>

        <div class="print-meta-grid">
          <div>
            <strong>রিপোর্ট:</strong> ${title}<br>
            <strong>সময়কাল:</strong> ${dateRange || 'আজ'}
          </div>
          <div style="text-align: right;">
            <strong>প্রিন্টের তারিখ:</strong> ${Utils.formatDateBengali(Utils.getTodayDateString())}<br>
            <strong>সময়:</strong> ${new Date().toLocaleTimeString('bn-BD')}
          </div>
        </div>

        <table class="print-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>তারিখ / নাম</th>
              <th>বিবরণ</th>
              <th>ধরন</th>
              <th>মাধ্যম</th>
              <th style="text-align: right;">পরিমাণ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="print-summary-box">
          <div class="print-summary-row">
            <span>মোট বিক্রি / আয়:</span>
            <strong>${Utils.formatCurrency(totals.income || totals.totalIncome || 0)}</strong>
          </div>
          <div class="print-summary-row">
            <span>দোকানের খরচ:</span>
            <strong>${Utils.formatCurrency(totals.shopExpenses || 0)}</strong>
          </div>
          <div class="print-summary-row" style="color: #0F5132; font-size: 15px;">
            <span>ব্যবসার মোট লাভ:</span>
            <strong>${Utils.formatCurrency(totals.businessProfit || 0)}</strong>
          </div>
          <div class="print-summary-row">
            <span>সংসার খরচ:</span>
            <strong>${Utils.formatCurrency(totals.householdExpenses || 0)}</strong>
          </div>
          <div class="print-summary-row print-highlight">
            <span>নিট সঞ্চয়:</span>
            <strong>${Utils.formatCurrency(totals.netSavings || 0)}</strong>
          </div>
        </div>

        <div class="print-footer">
          <div class="print-sign-col">
            <div class="print-sign-line">কাস্টমার / গ্রহীতার স্বাক্ষর</div>
          </div>
          <div class="print-sign-col" style="text-align: right;">
            <div class="print-sign-line">কর্তৃপক্ষের স্বাক্ষর</div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      window.print();
    }, 150);
  }
};

window.UI = UI;

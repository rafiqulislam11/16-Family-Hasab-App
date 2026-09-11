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
  },

  /**
   * Undo Toast Notification with Countdown
   */
  undoToast(message, onUndo, duration = 6000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'khata-toast toast-undo';
    toast.innerHTML = `
      <div class="toast-icon">🗑️</div>
      <div class="toast-message">${message}</div>
      <button type="button" class="btn-undo-action" id="toastUndoBtn">পূর্বাবস্থায় আনুন (Undo)</button>
    `;

    container.appendChild(toast);

    let undone = false;
    const undoBtn = toast.querySelector('#toastUndoBtn');
    if (undoBtn) {
      undoBtn.onclick = () => {
        undone = true;
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 200);
        if (typeof onUndo === 'function') onUndo();
        UI.toast('পূর্বের অবস্থা সফলভাবে ফিরিয়ে আনা হয়েছে ✓', 'success', 2500);
      };
    }

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      if (!undone && toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }
    }, duration);
  },

  /**
   * Printable Professional Invoice / Memo (RI Family & Business Hisab)
   */
  printInvoice({ profile = {}, invoiceNo = '', date = '', customer = {}, items = [], totals = {}, paymentMethod = 'Cash', note = '' }) {
    const printArea = document.getElementById('printableArea');
    if (!printArea) return;

    const bizName = profile.businessName || 'RI Family & Business Hisab';
    const ownerName = profile.ownerName || 'রফিকুল ইসলাম';
    const phone = profile.phone || '0131082-4987';
    const address = profile.address || 'বাংলাদেশ';
    const tagline = profile.tagline || 'ব্যবসা ও সংসারের হিসাব—সব এক জায়গায়।';

    let itemRows = '';
    (items || []).forEach((item, idx) => {
      const rate = Number(item.rate || item.price || item.sellingPrice) || 0;
      const qty = Number(item.qty || item.quantity) || 1;
      const lineTotal = Number(item.total !== undefined ? item.total : (rate * qty)) || 0;

      itemRows += `
        <tr>
          <td style="text-align: center;">${Utils.toBanglaNumber(idx + 1, false)}</td>
          <td><strong>${item.name || item.productName || 'পণ্য'}</strong></td>
          <td style="text-align: center;">${Utils.toBanglaNumber(qty, false)} ${item.unit || ''}</td>
          <td style="text-align: right;">${Utils.formatCurrency(rate, false)}</td>
          <td style="text-align: right; font-weight: bold;">${Utils.formatCurrency(lineTotal, false)}</td>
        </tr>
      `;
    });

    const subtotal = totals.subtotal !== undefined ? totals.subtotal : (totals.todayBill || 0);
    const discount = totals.discount || 0;
    const oldDue = totals.oldDue || 0;
    const grandTotal = totals.totalDue !== undefined ? totals.totalDue : (subtotal + oldDue - discount);
    const paid = totals.paid !== undefined ? totals.paid : (totals.todayPaid || 0);
    const due = totals.due !== undefined ? totals.due : (totals.netDue || Math.max(0, grandTotal - paid));

    printArea.innerHTML = `
      <div class="print-voucher print-invoice">
        <div class="print-header" style="text-align: center; border-bottom: 2px solid #1E3A8A; padding-bottom: 12px;">
          <div style="font-size: 13px; font-weight: 700; color: #1E3A8A; letter-spacing: 1px; margin-bottom: 2px;">RI Family &amp; Business Hisab</div>
          <div class="print-shop-name" style="font-size: 24px; font-weight: 800; color: #0F172A;">${bizName}</div>
          <div class="print-shop-owner" style="font-size: 13px; color: #475569;">প্রোপ্রাইটর: ${ownerName} | মোবাইল: ${phone}</div>
          <div class="print-shop-contact" style="font-size: 12px; color: #64748B;">${address}</div>
          <div style="font-size: 11px; color: #059669; font-style: italic; margin-top: 3px;">“${tagline}”</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 14px 0; font-size: 13px; background: #F8FAFC; padding: 10px 14px; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div>
            <div><strong>চালান / মেমো নং:</strong> <span style="font-family: monospace; font-weight: 800; color: #1E3A8A;">${invoiceNo || 'INV-001'}</span></div>
            <div><strong>তারিখ:</strong> ${Utils.formatDateBengali(date || Utils.getTodayDateString())}</div>
            <div><strong>পরিশোধ মাধ্যম:</strong> ${paymentMethod}</div>
          </div>
          <div style="text-align: right;">
            <div><strong>কাস্টমার:</strong> <span style="font-weight: 700; font-size: 15px;">${customer.name || customer.person || 'সম্মানিত ক্রেতা'}</span></div>
            ${customer.phone ? `<div><strong>ফোন:</strong> ${customer.phone}</div>` : ''}
            ${customer.address ? `<div><strong>ঠিকানা:</strong> ${customer.address}</div>` : ''}
          </div>
        </div>

        <table class="print-table" style="width: 100%; margin-top: 10px;">
          <thead>
            <tr style="background: #1E3A8A; color: #FFFFFF;">
              <th style="width: 40px; text-align: center;">#</th>
              <th>পণ্যের বিবরণ</th>
              <th style="width: 80px; text-align: center;">পরিমাণ</th>
              <th style="width: 90px; text-align: right;">দর (৳)</th>
              <th style="width: 100px; text-align: right;">মোট (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
          <div style="width: 280px; border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px;">
              <span>বর্তমান পণ্যের মোট:</span>
              <strong>${Utils.formatCurrency(subtotal)}</strong>
            </div>
            ${discount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #059669;">
              <span>ছাড় / ডিসকাউন্ট:</span>
              <strong>- ${Utils.formatCurrency(discount)}</strong>
            </div>` : ''}
            ${oldDue > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #D97706;">
              <span>পূর্বের বকেয়া বাকি:</span>
              <strong>+ ${Utils.formatCurrency(oldDue)}</strong>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; padding: 7px 12px; background: #F1F5F9; font-size: 14px; font-weight: 800; border-bottom: 1px solid #CBD5E1;">
              <span>সর্বমোট পাওনা:</span>
              <span>${Utils.formatCurrency(grandTotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #059669;">
              <span>আজকের জমা / পেইড:</span>
              <strong>${Utils.formatCurrency(paid)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 7px 12px; font-size: 15px; font-weight: 800; color: ${due > 0 ? '#DC2626' : '#059669'}; background: ${due > 0 ? '#FEF2F2' : '#F0FDF4'};">
              <span>বর্তমান অবশিষ্টাংশ বাকি:</span>
              <span>${Utils.formatCurrency(due)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 10px; font-size: 13px; color: #334155; padding: 8px 12px; background: #F8FAFC; border-radius: 6px;">
          <strong>কথায়:</strong> ${Utils.numberToBanglaWords(due > 0 ? due : (paid > 0 ? paid : grandTotal))}
        </div>

        ${note ? `<div style="margin-top: 6px; font-size: 12px; color: #64748B;"><em>নোট: ${note}</em></div>` : ''}

        <div class="print-footer" style="margin-top: 45px; display: flex; justify-content: space-between;">
          <div class="print-sign-col" style="text-align: left;">
            <div class="print-sign-line" style="width: 180px; border-top: 1px dashed #64748B; padding-top: 4px; font-size: 12px;">ক্রেতার স্বাক্ষর</div>
          </div>
          <div class="print-sign-col" style="text-align: right;">
            <div class="print-sign-line" style="width: 180px; border-top: 1px dashed #64748B; padding-top: 4px; font-size: 12px;">কর্তৃপক্ষের সিল ও স্বাক্ষর</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 25px; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 8px;">
          ধন্যবাদ! আবার আসবেন। • Powered by RI Family &amp; Business Hisab
        </div>
      </div>
    `;

    setTimeout(() => {
      window.print();
    }, 150);
  }
};

window.UI = UI;

/**
 * খাতা — Responsive High-DPI Canvas Chart Engine
 * Clean, lightweight, zero-dependency charts optimized for mobile & desktop
 */

const KhataCharts = {
  /**
   * Helper to set up Retina-crisp Canvas
   */
  setupCanvas(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const displayWidth = rect.width || 320;
    const displayHeight = rect.height || 220;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    ctx.scale(dpr, dpr);
    return { ctx, width: displayWidth, height: displayHeight };
  },

  /**
   * 1. Multi-Bar Comparison Chart (Income vs Shop Expense vs Household Expense)
   */
  drawBarChart(canvasId, data = []) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      this.drawEmptyState(ctx, width, height);
      return;
    }

    const padding = { top: 25, right: 20, bottom: 40, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Determine max value
    let maxVal = 0;
    data.forEach(d => {
      maxVal = Math.max(maxVal, d.income || 0, d.shopExpense || 0, d.houseExpense || 0);
    });
    if (maxVal === 0) maxVal = 1000;
    maxVal = Math.ceil(maxVal * 1.15); // headroom

    // Draw horizontal grid lines
    const gridSteps = 4;
    ctx.strokeStyle = document.body.classList.contains('dark-theme') ? '#334155' : '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#94A3B8' : '#6B7280';
    ctx.font = '11px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridSteps; i++) {
      const yVal = (maxVal / gridSteps) * i;
      const yPos = padding.top + chartH - (i / gridSteps) * chartH;

      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(padding.left + chartW, yPos);
      ctx.stroke();

      ctx.fillText(Utils.toBanglaNumber(Math.round(yVal)), padding.left - 8, yPos + 4);
    }

    // Draw Bars
    const groupCount = data.length;
    const groupWidth = chartW / groupCount;
    const barWidth = Math.min(14, (groupWidth - 10) / 3);

    data.forEach((item, idx) => {
      const groupCenterX = padding.left + (idx * groupWidth) + (groupWidth / 2);

      // Income bar (Green)
      const incH = ((item.income || 0) / maxVal) * chartH;
      const incX = groupCenterX - barWidth * 1.5;
      const incY = padding.top + chartH - incH;
      ctx.fillStyle = '#10B981';
      this.roundRect(ctx, incX, incY, barWidth, incH, 3);

      // Shop Expense bar (Red/Orange)
      const shopH = ((item.shopExpense || 0) / maxVal) * chartH;
      const shopX = groupCenterX - barWidth * 0.5;
      const shopY = padding.top + chartH - shopH;
      ctx.fillStyle = '#EF4444';
      this.roundRect(ctx, shopX, shopY, barWidth, shopH, 3);

      // Household Expense bar (Purple/Blue)
      const houseH = ((item.houseExpense || 0) / maxVal) * chartH;
      const houseX = groupCenterX + barWidth * 0.5;
      const houseY = padding.top + chartH - houseH;
      ctx.fillStyle = '#6366F1';
      this.roundRect(ctx, houseX, houseY, barWidth, houseH, 3);

      // X Axis Label
      ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#CBD5E1' : '#4B5563';
      ctx.textAlign = 'center';
      ctx.font = '11px "Hind Siliguri", sans-serif';
      ctx.fillText(item.label || '', groupCenterX, height - 12);
    });
  },

  /**
   * 2. Smooth Line & Area Chart for Sales / Profit Trend
   */
  drawLineTrendChart(canvasId, points = []) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    ctx.clearRect(0, 0, width, height);

    if (!points || points.length === 0) {
      this.drawEmptyState(ctx, width, height);
      return;
    }

    const padding = { top: 20, right: 20, bottom: 35, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    let maxVal = Math.max(...points.map(p => p.value || 0), 500);
    maxVal = Math.ceil(maxVal * 1.15);

    // Grid lines
    ctx.strokeStyle = document.body.classList.contains('dark-theme') ? '#334155' : '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#94A3B8' : '#6B7280';
    ctx.font = '11px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const yVal = (maxVal / 4) * i;
      const yPos = padding.top + chartH - (i / 4) * chartH;

      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(padding.left + chartW, yPos);
      ctx.stroke();

      ctx.fillText(Utils.toBanglaNumber(Math.round(yVal)), padding.left - 8, yPos + 4);
    }

    // Compute coordinates
    const coords = points.map((p, idx) => {
      const x = padding.left + (idx / Math.max(1, points.length - 1)) * chartW;
      const y = padding.top + chartH - ((p.value || 0) / maxVal) * chartH;
      return { x, y, label: p.label, value: p.value };
    });

    // Draw Gradient Area Under Curve
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, 'rgba(15, 81, 50, 0.35)');
    grad.addColorStop(1, 'rgba(15, 81, 50, 0.01)');

    ctx.beginPath();
    ctx.moveTo(coords[0].x, padding.top + chartH);
    coords.forEach((pt, i) => {
      if (i === 0) ctx.lineTo(pt.x, pt.y);
      else {
        const prev = coords[i - 1];
        const cpX = (prev.x + pt.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, pt.y, pt.x, pt.y);
      }
    });
    ctx.lineTo(coords[coords.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Line
    ctx.beginPath();
    coords.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else {
        const prev = coords[i - 1];
        const cpX = (prev.x + pt.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, pt.y, pt.x, pt.y);
      }
    });
    ctx.strokeStyle = '#0F5132';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Points & Labels
    coords.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#0F5132';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label below
      ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#CBD5E1' : '#4B5563';
      ctx.textAlign = 'center';
      ctx.font = '11px "Hind Siliguri", sans-serif';
      ctx.fillText(pt.label || '', pt.x, height - 12);
    });
  },

  /**
   * 3. Donut Chart for Expense Categories
   */
  drawDonutChart(canvasId, items = []) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    ctx.clearRect(0, 0, width, height);

    if (!items || items.length === 0) {
      this.drawEmptyState(ctx, width, height);
      return;
    }

    const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (total === 0) {
      this.drawEmptyState(ctx, width, height);
      return;
    }

    const cx = width / 2;
    const cy = height / 2 - 10;
    const outerR = Math.min(width, height) * 0.36;
    const innerR = outerR * 0.62;

    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
      '#EC4899', '#14B8A6', '#6366F1', '#84CC16', '#64748B'
    ];

    let currentAngle = -Math.PI / 2;

    items.forEach((item, idx) => {
      const sliceAngle = ((Number(item.amount) || 0) / total) * (Math.PI * 2);
      const color = colors[idx % colors.length];

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, currentAngle, currentAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Center Summary
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#F8FAFC' : '#111827';
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px "Hind Siliguri", sans-serif';
    ctx.fillText(Utils.formatCurrency(total), cx, cy + 5);

    ctx.font = '11px "Hind Siliguri", sans-serif';
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#94A3B8' : '#6B7280';
    ctx.fillText('মোট খরচ', cx, cy + 22);
  },

  /**
   * 4. Debt Ratio Semi-Circle Gauge (আমি পাব বনাম আমি দেব)
   */
  drawDebtRatioChart(canvasId, receivable = 0, payable = 0) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    ctx.clearRect(0, 0, width, height);

    const total = receivable + payable;
    const cx = width / 2;
    const cy = height - 25;
    const r = Math.min(width * 0.42, height * 0.7);

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.lineWidth = 18;
    ctx.strokeStyle = document.body.classList.contains('dark-theme') ? '#334155' : '#E2E8F0';
    ctx.stroke();

    if (total > 0) {
      const recAngle = (receivable / total) * Math.PI;

      // Receivable arc (Green)
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI + recAngle);
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#10B981';
      ctx.stroke();

      // Payable arc (Amber/Red)
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI + recAngle, 0);
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#F59E0B';
      ctx.stroke();
    }

    // Center Label
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Hind Siliguri", sans-serif';
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#F8FAFC' : '#111827';
    ctx.fillText(Utils.formatCurrency(receivable - payable), cx, cy - 25);

    ctx.font = '11px "Hind Siliguri", sans-serif';
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#94A3B8' : '#6B7280';
    ctx.fillText('নিট দেনা-পাওনা ভারসাম্য', cx, cy - 10);
  },

  /**
   * Helper to draw rounded rectangles
   */
  roundRect(ctx, x, y, width, height, radius) {
    if (height <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  },

  drawEmptyState(ctx, width, height) {
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#64748B' : '#9CA3AF';
    ctx.textAlign = 'center';
    ctx.font = '13px "Hind Siliguri", sans-serif';
    ctx.fillText('এই সময়ের কোনো চার্ট ডাটা নেই', width / 2, height / 2);
  }
};

window.KhataCharts = KhataCharts;

// Auto-resize and redraw charts on device rotation or browser resize
(function() {
  let resizeDebounce = null;
  function handleResize() {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
      if (typeof App !== 'undefined') {
        const view = App.currentView || 'dashboard';
        if (view === 'dashboard' && typeof App.renderDashboardTrendChart === 'function') {
          App.renderDashboardTrendChart();
        } else if (view === 'reports' && typeof App.renderReportsView === 'function') {
          App.renderReportsView();
        } else if (view === 'family' && typeof App.renderFamilyView === 'function') {
          App.renderFamilyView();
        }
      }
    }, 180);
  }

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 220);
  }, { passive: true });
})();

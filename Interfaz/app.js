/**
 * Bicicletas Mejía — Master SPA Controller con Control de Roles y Permisos Estricto
 */

// ── Configuración de Roles y Permisos Empresariales ────────
const ROLE_CONFIG = {
  admin: {
    label: 'Administrador general',
    name: 'Sebastián Mejía',
    caja: 'Caja Principal',
    defaultView: 'dashboard',
    views: ['dashboard', 'reports', 'users', 'pos', 'shift', 'inventory', 'purchases', 'adjustments', 'clients', 'suppliers'],
    canCreateProduct: true,
    canEditProduct: true,
    canDeleteProduct: true,
    canMakeSales: true,
    canReceiveStock: true,
    canAdjustStock: true,
    canViewFinancials: true,
    canManageUsers: true
  },
  cajero: {
    label: 'Cajero',
    name: 'Camila Morales',
    caja: 'Caja #2 - Ventas',
    defaultView: 'pos',
    // Estación de Venta: Exclusivamente Caja y Turno de caja
    views: ['pos', 'shift'],
    canCreateProduct: false,
    canEditProduct: false,
    canDeleteProduct: false,
    canMakeSales: true,
    canReceiveStock: false,
    canAdjustStock: false,
    canViewFinancials: false,
    canManageUsers: false
  },
  bodeguero: {
    label: 'Bodeguero',
    name: 'Carlos Rendón',
    caja: 'Almacén Central',
    defaultView: 'inventory',
    // Estación de Almacén: Inventario, Compras, Ajustes y Proveedores
    views: ['inventory', 'purchases', 'adjustments', 'suppliers'],
    canCreateProduct: true,
    canEditProduct: true,
    canDeleteProduct: false,
    canMakeSales: false,
    canReceiveStock: true,
    canAdjustStock: true,
    canViewFinancials: false,
    canManageUsers: false
  }
};

const App = {
  currentView: 'dashboard',
  currentUser: null,
  cart: [],
  selectedClientId: 1,
  activePosCategory: null,
  posSearchQuery: '',
  inventoryFilterCategory: 'all',
  inventoryFilterStock: 'all',
  inventorySearchQuery: '',
  clientSearchQuery: '',
  supplierSearchQuery: '',

  init() {
    this.checkAuth();
    const role = this.currentUser?.role || 'admin';
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
    this.currentView = config.defaultView || 'pos';
    this.bindGlobalEvents();
    this.applyRolePermissions();
    this.startLiveClock();
    this.updateExchangeRateUI();
    this.navigate(this.currentView);
  },

  startLiveClock() {
    const update = () => {
      const el = document.getElementById('system-live-clock');
      if (el) {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const d = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        el.textContent = `${d} ${t}`;
      }
    };
    update();
    setInterval(update, 1000);
  },

  checkAuth() {
    try {
      const session = localStorage.getItem('bm_session');
      if (session) {
        this.currentUser = JSON.parse(session);
        // Normalize role key
        if (!ROLE_CONFIG[this.currentUser.role]) {
          this.currentUser.role = 'admin';
        }
      } else {
        this.currentUser = {
          username: 'admin',
          name: 'Sebastián Mejía',
          role: 'admin',
          caja: 'Caja Principal'
        };
        localStorage.setItem('bm_session', JSON.stringify(this.currentUser));
      }
    } catch {
      window.location.href = 'login.html';
    }
  },

  logout() {
    localStorage.removeItem('bm_session');
    window.location.href = 'login.html';
  },

  // ── Aplicación Estricta de Permisos por Rol ───────────────
  applyRolePermissions() {
    const role = this.currentUser.role || 'admin';
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin;

    // 1. Filtrar visibilidad en la barra de navegación lateral
    document.querySelectorAll('.nav-btn[data-view], .nav-item[data-view]').forEach(item => {
      const viewKey = item.dataset.view;
      if (config.views.includes(viewKey)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    // 2. Filtrar encabezados de sección en la barra lateral
    const posItems = ['pos', 'shift'].some(v => config.views.includes(v));
    const warehouseItems = ['inventory', 'purchases', 'adjustments'].some(v => config.views.includes(v));
    const mgmtItems = ['clients', 'suppliers'].some(v => config.views.includes(v));
    const adminItems = ['dashboard', 'reports', 'users'].some(v => config.views.includes(v));

    const secPos = document.getElementById('nav-sec-pos');
    const secWarehouse = document.getElementById('nav-sec-warehouse');
    const secMgmt = document.getElementById('nav-sec-management');
    const secAdmin = document.getElementById('nav-sec-admin');

    if (secPos) secPos.style.display = posItems ? 'block' : 'none';
    if (secWarehouse) secWarehouse.style.display = warehouseItems ? 'block' : 'none';
    if (secMgmt) secMgmt.style.display = mgmtItems ? 'block' : 'none';
    if (secAdmin) secAdmin.style.display = adminItems ? 'block' : 'none';

    // 3. Actualizar información de usuario en pie de sidebar y cabecera
    const userRoleEl = document.getElementById('current-user-role');
    const userNameEl = document.getElementById('current-user-name');
    const userAvatarEl = document.getElementById('current-user-avatar');
    const userCajaEl = document.getElementById('current-user-caja');

    const displayName = config.name || this.currentUser.name;
    const displayCaja = config.caja || 'Caja Principal';

    if (userNameEl) userNameEl.textContent = displayName;
    if (userRoleEl) userRoleEl.textContent = config.label;
    if (userCajaEl) userCajaEl.textContent = displayCaja;
    if (userAvatarEl) userAvatarEl.textContent = (displayName || 'A').charAt(0).toUpperCase();

    // 4. Control de visibilidad de la tasa oficial BCV según rol
    const bcvBtn = document.getElementById('topbar-bcv-btn');
    if (bcvBtn) {
      if (role === 'bodeguero') {
        // Almacén solo gestiona existencias físicas, no requiere conversión de divisas
        bcvBtn.style.display = 'none';
      } else if (role === 'cajero') {
        // En caja es obligatoria como referencia de cobro, pero en modo lectura
        bcvBtn.style.display = 'inline-flex';
        bcvBtn.title = 'Tasa oficial BCV de referencia para cobro en bolívares';
        bcvBtn.onclick = () => {
          this.showToast('Tasa oficial BCV de referencia para caja. Solo el administrador puede modificarla.', 'info');
        };
      } else {
        // Administrador: acceso completo para ajustar la tasa oficial
        bcvBtn.style.display = 'inline-flex';
        bcvBtn.title = 'Configurar tasa oficial BCV';
        bcvBtn.onclick = () => {
          this.openExchangeRateModal();
        };
      }
    }

    this.updateBadges();
  },

  // Cambiar rol interactivamente para probar las restricciones en vivo
  switchRole(newRole) {
    if (!ROLE_CONFIG[newRole]) return;

    const config = ROLE_CONFIG[newRole];
    this.currentUser = {
      username: newRole,
      name: config.name,
      role: newRole,
      caja: config.caja,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('bm_session', JSON.stringify(this.currentUser));

    this.applyRolePermissions();
    this.navigate(config.defaultView);

    const messages = {
      admin: 'Estación de administración activada (Panel gerencial).',
      cajero: 'Terminal de caja activada.',
      bodeguero: 'Terminal de almacén activada (Inventario y compras).'
    };
    this.showToast(messages[newRole] || 'Estación actualizada', 'info');
  },

  updateBadges() {
    const products = StoreManager.getProducts();
    const lowStockCount = products.filter(p => p.unit !== 'SRV' && p.stock <= p.minStock).length;
    const badge = document.getElementById('nav-inventory-badge');
    if (badge) {
      if (lowStockCount > 0) {
        badge.textContent = lowStockCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  },

  bindGlobalEvents() {
    document.querySelectorAll('.nav-btn[data-view], .nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        this.navigate(item.dataset.view);
      });
    });

    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.getElementById('app-shell').classList.toggle('sidebar-collapsed');
      });
    }

    // Cierre seguro de modales al hacer clic en el fondo oscuro (backdrop)
    // Evita que clics en selects, opciones desplegables o arrastre de texto cierren el modal
    document.querySelectorAll('dialog').forEach(modal => {
      modal.addEventListener('mousedown', (e) => {
        modal._clickedBackdrop = (e.target === modal);
      });
      modal.addEventListener('mouseup', (e) => {
        if (modal._clickedBackdrop && e.target === modal) {
          modal.close();
        }
        modal._clickedBackdrop = false;
      });
    });

    // Atajos de teclado empresariales (F2, F4, F9, ESC)
    window.addEventListener('keydown', (e) => {
      // F2: Búsqueda rápida
      if (e.key === 'F2') {
        e.preventDefault();
        if (this.currentView === 'pos') {
          const input = document.getElementById('pos-search-input');
          if (input) { input.focus(); input.select(); }
        } else if (this.currentView === 'inventory') {
          const input = document.getElementById('inv-search-input') || document.querySelector('#view-inventory input');
          if (input) { input.focus(); input.select(); }
        }
      }
      // F4: Procesar cobro en POS
      else if (e.key === 'F4') {
        if (this.currentView === 'pos' && this.cart.length > 0) {
          e.preventDefault();
          this.openCheckoutModal();
        }
      }
      // F9: Registrar nuevo cliente
      else if (e.key === 'F9') {
        e.preventDefault();
        this.openNewClientModal();
      }
      // Escape: Cerrar modales abiertos o limpiar venta
      else if (e.key === 'Escape') {
        const openDialog = document.querySelector('dialog[open]');
        if (openDialog) {
          openDialog.close();
        }
      }
    });
  },

  navigate(viewId) {
    const role = this.currentUser.role || 'admin';
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin;

    // Si la estación no incluye esa vista, redirigir a su vista de trabajo predeterminada
    if (!config.views.includes(viewId)) {
      viewId = config.defaultView || config.views[0];
    }

    this.currentView = viewId;

    document.querySelectorAll('.nav-btn, .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewId);
    });

    const breadcrumb = document.getElementById('breadcrumb-title');
    const viewTitles = {
      dashboard: 'Panel gerencial',
      pos: 'Caja',
      shift: 'Turno de caja',
      inventory: 'Inventario',
      purchases: 'Compras',
      adjustments: 'Ajustes',
      clients: 'Clientes',
      suppliers: 'Proveedores',
      reports: 'Reportes',
      users: 'Usuarios'
    };
    if (breadcrumb) breadcrumb.textContent = viewTitles[viewId] || 'Inicio';

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.style.display = 'none';
    });
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.style.display = 'block';
    }

    switch (viewId) {
      case 'dashboard': this.renderDashboard(); break;
      case 'pos': this.renderPos(); break;
      case 'shift': this.renderShift(); break;
      case 'inventory': this.renderInventory(); break;
      case 'purchases': this.renderPurchases(); break;
      case 'adjustments': this.renderAdjustments(); break;
      case 'clients': this.renderClients(); break;
      case 'suppliers': this.renderSuppliers(); break;
      case 'reports': this.renderReports(); break;
      case 'users': this.renderUsers(); break;
    }

    this.updateBadges();
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error: `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info: `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    };

    toast.innerHTML = `
      ${icons[type] || icons.info}
      <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  },

  // ══════════════════════════════════════════════════════════
  // 1. DASHBOARD
  // ══════════════════════════════════════════════════════════
  renderDashboard() {
    const role = this.currentUser.role || 'admin';
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
    const products = StoreManager.getProducts();
    const sales = StoreManager.getSales();

    const todaySales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const lowStockItems = products.filter(p => p.unit !== 'SRV' && p.stock <= p.minStock);
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.unit !== 'SRV' ? p.costPrice * p.stock : 0), 0);

    // 1. Tarjetas KPI consolidadas para la administración general
    const kpiGrid = document.getElementById('dash-kpi-grid');
    if (kpiGrid) {
      kpiGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Ventas consolidadas (hoy)</span>
            <div class="stat-card-icon" style="background: var(--status-success-bg); color: var(--status-success-text);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="stat-card-value font-mono text-success">${formatMoney(todaySales)}</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Facturas emitidas</span>
            <div class="stat-card-icon" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div class="stat-card-value font-mono">${sales.length}</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Alertas de stock crítico</span>
            <div class="stat-card-icon" style="background: var(--status-danger-bg); color: var(--status-danger-text);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div class="stat-card-value font-mono text-danger">${lowStockItems.length}</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Valorización de almacén</span>
            <div class="stat-card-icon" style="background: var(--status-info-bg); color: var(--status-info-text);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
          </div>
          <div class="stat-card-value font-mono text-primary">${formatMoney(totalInventoryValue)}</div>
        </div>
      `;
    }

    // 3. Gráfico y secciones gerenciales
    const chartCard = document.getElementById('dash-chart-card');
    const middleGrid = document.getElementById('dash-middle-grid');
    const recentSalesCard = document.getElementById('dash-recent-sales-card');

    if (chartCard) chartCard.style.display = 'block';
    if (middleGrid) middleGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    if (recentSalesCard) recentSalesCard.style.display = 'block';

    const drawersList = document.getElementById('dash-drawers-list');
    if (drawersList) {
      const shifts = StoreManager.getShifts();
      const stations = [
        { caja: 'Caja Principal', defaultCashier: 'Sebastián Mejía' },
        { caja: 'Caja #2 - Ventas', defaultCashier: 'Camila Morales' },
        { caja: 'Almacén Central', defaultCashier: 'Carlos Rendón' }
      ];

      drawersList.innerHTML = stations.map(st => {
        const active = shifts.find(s => s.caja === st.caja && s.status === 'abierto');
        if (active) {
          const cashTotal = (active.baseCash || 0) + (active.cashSales || 0);
          return `
            <div class="drawer-status-item">
              <div class="drawer-info">
                <div class="font-bold text-main">${st.caja}</div>
                <div class="text-xs text-muted">Responsable: ${active.cashierName || st.defaultCashier}</div>
              </div>
              <div class="text-right">
                <div class="font-mono font-bold text-success">${formatUSD(cashTotal)} en gaveta</div>
                <span class="badge badge-success">Turno Abierto</span>
              </div>
            </div>
          `;
        } else {
          return `
            <div class="drawer-status-item">
              <div class="drawer-info">
                <div class="font-bold text-main">${st.caja}</div>
                <div class="text-xs text-muted">Responsable: ${st.defaultCashier}</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-muted">Sin turno abierto</div>
                <span class="badge badge-neutral">Cerrada</span>
              </div>
            </div>
          `;
        }
      }).join('');
    }

    // 4. Tabla de Stock Crítico
    const thAction = document.getElementById('th-dash-low-stock-action');
    if (thAction) {
      thAction.style.display = config.canReceiveStock ? '' : 'none';
    }

    const lowStockTbody = document.getElementById('dash-low-stock-tbody');
    if (lowStockTbody) {
      if (lowStockItems.length === 0) {
        lowStockTbody.innerHTML = `
          <tr>
            <td colspan="${config.canReceiveStock ? 5 : 4}" class="text-center text-muted" style="padding: 1.5rem;">
              No hay productos con alerta de stock en este momento.
            </td>
          </tr>
        `;
      } else {
        lowStockTbody.innerHTML = lowStockItems.map(item => `
          <tr>
            <td>
              <div class="font-semibold text-primary">${item.name}</div>
              <div class="text-xs text-muted font-mono">${item.sku}</div>
            </td>
            <td><span class="badge badge-neutral">${item.categoryName}</span></td>
            <td>
              <div class="stock-bar" style="width: 100px;">
                <div class="stock-bar-track">
                  <div class="stock-bar-fill low" style="width: ${Math.min(100, (item.stock / (item.minStock || 1)) * 30)}%;"></div>
                </div>
                <span class="stock-bar-value text-danger">${item.stock}</span>
              </div>
            </td>
            <td class="text-muted font-mono">${item.minStock} ${item.unit}</td>
            ${config.canReceiveStock
              ? `<td class="text-right">
                  <button class="btn btn-sm btn-primary" onclick="App.openPurchaseForProduct(${item.id})">+ Pedir Stock</button>
                 </td>`
              : ''
            }
          </tr>
        `).join('');
      }
    }

    // 5. Historial de Ventas (solo se renderiza si canMakeSales es true)
    if (config.canMakeSales && recentSalesCard) {
      const salesTbody = document.getElementById('dash-recent-sales-tbody');
      if (salesTbody) {
        salesTbody.innerHTML = sales.slice(0, 5).map(sale => `
          <tr>
            <td>
              <span class="font-mono text-accent font-semibold">${sale.invoiceNumber}</span>
            </td>
            <td>${sale.clientName}</td>
            <td><span class="badge badge-info">${sale.paymentMethod}</span></td>
            <td><span class="text-xs text-muted">${new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
            <td class="text-right font-bold text-primary">${formatMoney(sale.total)}</td>
            <td class="text-right">
              <button class="btn btn-sm btn-secondary btn-icon" title="Ver Recibo" onclick="App.showReceiptModal('${sale.invoiceNumber}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  },

  // ══════════════════════════════════════════════════════════
  // 2. POS / FACTURACIÓN
  // ══════════════════════════════════════════════════════════
  renderPos() {
    this.renderPosCategories();
    this.renderPosProducts();
    this.renderPosClientsSelect();
    this.renderCart();
  },

  renderPosCategories() {
    const scroller = document.getElementById('pos-categories-scroller');
    if (!scroller) return;

    const categories = StoreManager.getCategories();
    scroller.innerHTML = `
      <button class="pos-cat-chip ${this.activePosCategory === null ? 'active' : ''}" onclick="App.setPosCategory(null)">
        Todos los productos
      </button>
      ${categories.map(cat => `
        <button class="pos-cat-chip ${this.activePosCategory === cat.id ? 'active' : ''}" onclick="App.setPosCategory(${cat.id})">
          ${cat.name}
        </button>
      `).join('')}
    `;
  },

  setPosCategory(catId) {
    this.activePosCategory = catId;
    this.renderPosCategories();
    this.renderPosProducts();
  },

  onPosSearch(val) {
    this.posSearchQuery = val.toLowerCase().trim();
    this.renderPosProducts();
  },

  onPosSearchKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = this.posSearchQuery.trim();
      if (!q) return;

      const products = StoreManager.getProducts().filter(p => p.active !== false);
      // Prioridad 1: Coincidencia exacta de código de barras o SKU
      let match = products.find(p => p.barcode === q || p.sku.toLowerCase() === q);
      // Prioridad 2: Coincidencia única por nombre
      if (!match) {
        const matches = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q));
        if (matches.length === 1) {
          match = matches[0];
        }
      }

      if (match) {
        if (match.unit !== 'SRV' && match.stock <= 0) {
          this.showToast(`Artículo sin existencia: ${match.name}`, 'warning');
        } else {
          this.addToCart(match.id);
          this.showToast(`Artículo cargado: ${match.name}`, 'success');
          const input = document.getElementById('pos-search-input');
          if (input) {
            input.value = '';
            this.posSearchQuery = '';
            this.renderPosProducts();
          }
        }
      } else {
        this.showToast(`No se encontró coincidencia para: "${q}"`, 'info');
      }
    }
  },

  renderPosProducts() {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;

    let products = StoreManager.getProducts().filter(p => p.active !== false);

    if (this.activePosCategory !== null) {
      products = products.filter(p => p.categoryId === this.activePosCategory);
    }

    if (this.posSearchQuery) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(this.posSearchQuery) ||
        p.sku.toLowerCase().includes(this.posSearchQuery) ||
        p.barcode.includes(this.posSearchQuery)
      );
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;" class="text-muted">
          No se encontraron productos coincidentes.
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(p => {
      const isOutOfStock = p.unit !== 'SRV' && p.stock <= 0;
      return `
        <div class="pos-product-card ${isOutOfStock ? 'out-of-stock' : ''}" onclick="${isOutOfStock ? '' : `App.addToCart(${p.id})`}">
          <div>
            <div class="pos-card-category">${p.categoryName}</div>
            <div class="pos-card-title">${p.name}</div>
            <div class="pos-card-sku">${p.sku} · ${p.barcode}</div>
          </div>
          <div class="pos-card-footer">
            <div class="pos-card-price"><div>${formatUSD(p.salePrice)}</div><div class="text-xs text-muted font-normal">${formatVES(p.salePrice)}</div></div>
            <div>
              ${p.unit === 'SRV'
                ? `<span class="badge badge-info pos-card-stock-badge">Servicio</span>`
                : `<span class="badge ${p.stock <= p.minStock ? 'badge-danger' : 'badge-neutral'} pos-card-stock-badge">Stock: ${p.stock}</span>`
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderPosClientsSelect() {
    const select = document.getElementById('pos-client-select');
    if (!select) return;
    const clients = StoreManager.getClients();
    select.innerHTML = clients.map(c => `
      <option value="${c.id}" ${c.id === this.selectedClientId ? 'selected' : ''}>
        ${c.name} (${c.document})
      </option>
    `).join('');
  },

  addToCart(productId) {
    const products = StoreManager.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = this.cart.findIndex(i => i.id === productId);
    if (existingIndex > -1) {
      if (product.unit !== 'SRV' && this.cart[existingIndex].qty >= product.stock) {
        this.showToast(`Stock máximo alcanzado: ${product.stock}`, 'warning');
        return;
      }
      this.cart[existingIndex].qty += 1;
      this.cart[existingIndex].subtotal = this.cart[existingIndex].qty * product.salePrice;
    } else {
      if (product.unit !== 'SRV' && product.stock < 1) {
        this.showToast('Producto sin existencia disponible', 'error');
        return;
      }
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.salePrice,
        sku: product.sku,
        unit: product.unit,
        maxStock: product.stock,
        qty: 1,
        subtotal: product.salePrice
      });
    }

    this.renderCart();

    const countBadge = document.getElementById('pos-cart-count');
    if (countBadge) {
      countBadge.classList.remove('cart-pulse');
      void countBadge.offsetWidth;
      countBadge.classList.add('cart-pulse');
    }
  },

  updateCartQty(productId, delta) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (item.unit !== 'SRV' && newQty > item.maxStock) {
      this.showToast(`Existencia máxima: ${item.maxStock}`, 'warning');
      return;
    }

    item.qty = newQty;
    item.subtotal = item.qty * item.price;
    this.renderCart();
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.id !== productId);
    this.renderCart();
  },

  clearCart(askConfirmation = true) {
    if (this.cart.length === 0) return;
    if (!askConfirmation || confirm('¿Desea vaciar los artículos del ticket actual?')) {
      this.cart = [];
      this.renderCart();
      if (askConfirmation) {
        this.showToast('Ticket de venta vaciado', 'info');
      }
    }
  },

  renderCart() {
    const itemsList = document.getElementById('pos-cart-items-list');
    const emptyNotice = document.getElementById('pos-cart-empty');
    const checkoutBtn = document.getElementById('pos-checkout-btn');
    const itemsCountBadge = document.getElementById('pos-cart-count');

    if (!itemsList) return;

    if (this.cart.length === 0) {
      if (emptyNotice) emptyNotice.style.display = 'flex';
      itemsList.innerHTML = '';
      if (checkoutBtn) checkoutBtn.disabled = true;
      if (itemsCountBadge) itemsCountBadge.textContent = '0 artículos';
      this.updateCartSummary(0, 0, 0);
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = false;

    const totalItems = this.cart.reduce((a, b) => a + b.qty, 0);
    if (itemsCountBadge) itemsCountBadge.textContent = `${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}`;

    itemsList.innerHTML = this.cart.map(item => `
      <div class="pos-cart-item">
        <div class="pos-item-info">
          <div class="pos-item-name" title="${item.name}">${item.name}</div>
          <div class="pos-item-unit-price font-mono">${formatMoney(item.price)}</div>
        </div>
        <div class="pos-item-qty-ctrl">
          <button class="pos-qty-btn" onclick="App.updateCartQty(${item.id}, -1)">−</button>
          <span class="pos-qty-value">${item.qty}</span>
          <button class="pos-qty-btn" onclick="App.updateCartQty(${item.id}, 1)">+</button>
        </div>
        <div class="pos-item-total font-mono">${formatMoney(item.subtotal)}</div>
        <button class="pos-item-remove-btn" onclick="App.removeFromCart(${item.id})" title="Quitar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `).join('');

    const subtotal = this.cart.reduce((a, b) => a + b.subtotal, 0);
    this.updateCartSummary(subtotal, 0, subtotal);
  },

  updateCartSummary(subtotal, discount, total) {
    const subtotalEl = document.getElementById('pos-summary-subtotal');
    const totalEl = document.getElementById('pos-summary-total');
    const vesEl = document.getElementById('pos-summary-ves');
    if (subtotalEl) subtotalEl.textContent = formatUSD(subtotal);
    if (totalEl) totalEl.textContent = formatUSD(total);
    if (vesEl) vesEl.textContent = formatVES(total);
  },

  openCheckoutModal() {
    if (this.cart.length === 0) return;

    const caja = this.currentUser.caja || 'Caja Principal';
    const activeShift = StoreManager.getActiveShift(caja);
    if (!activeShift) {
      if (confirm(`El turno de caja en "${caja}" se encuentra cerrado.\n\n¿Desea ir a "Turno de caja" para abrir el turno con la base de cambio?`)) {
        this.navigate('shift');
      }
      return;
    }

    const subtotal = this.cart.reduce((a, b) => a + b.subtotal, 0);
    const clients = StoreManager.getClients();
    const clientSelect = document.getElementById('pos-client-select');
    const selectedClientId = clientSelect ? parseInt(clientSelect.value) : 1;
    const client = clients.find(c => c.id === selectedClientId) || clients[0];

    const totalDisplay = document.getElementById('pay-modal-total-display');
    if (totalDisplay) {
      totalDisplay.innerHTML = `${formatUSD(subtotal)} <span class="text-xs text-muted font-normal">(${formatVES(subtotal)})</span>`;
    }

    const clientDisplay = document.getElementById('pay-modal-client-name');
    if (clientDisplay) {
      clientDisplay.textContent = `${client.name} · ${client.document}`;
    }

    // Set amounts in Venezuelan method badges
    const pmMonto = document.getElementById('pm-monto-ves');
    if (pmMonto) pmMonto.textContent = formatVES(subtotal);

    const pointMonto = document.getElementById('point-monto-ves');
    if (pointMonto) pointMonto.textContent = formatVES(subtotal);

    const zelleMonto = document.getElementById('zelle-monto-usd');
    if (zelleMonto) zelleMonto.textContent = `${formatUSD(subtotal)} USD`;

    // Reset reference inputs
    const pmRef = document.getElementById('pm-ref-input');
    if (pmRef) pmRef.value = '';
    const pointRef = document.getElementById('point-ref-input');
    if (pointRef) pointRef.value = '';
    const zelleRef = document.getElementById('zelle-ref-input');
    if (zelleRef) zelleRef.value = '';

    const cashInput = document.getElementById('pay-modal-cash-received');
    if (cashInput) cashInput.value = subtotal.toFixed(2);

    // Default payment method: Pago Móvil
    const defaultBtn = document.querySelector('.pay-method-btn');
    this.setPaymentMethod('Pago Móvil', defaultBtn);

    const dialog = document.getElementById('checkout-dialog');
    if (dialog) dialog.showModal();
  },

  setPaymentMethod(method, btn) {
    this.selectedPaymentMethod = method;
    document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const pmBox = document.getElementById('pagomovil-payment-details');
    const posBox = document.getElementById('pospoint-payment-details');
    const cashBox = document.getElementById('cash-payment-details');
    const zelleBox = document.getElementById('zelle-payment-details');

    if (pmBox) pmBox.style.display = (method === 'Pago Móvil' || method === 'Transferencia Bs.') ? 'block' : 'none';
    if (posBox) posBox.style.display = (method === 'Punto de Venta' || method.includes('Punto de Venta')) ? 'block' : 'none';
    if (cashBox) cashBox.style.display = (method === 'Efectivo USD ($)' || method === 'Efectivo Bs.') ? 'block' : 'none';
    if (zelleBox) zelleBox.style.display = method === 'Zelle' ? 'block' : 'none';

    this.updateChangeCalculation();
  },

  onReferenceInput() {
    this.updateChangeCalculation();
  },

  setQuickCash(amount) {
    const input = document.getElementById('pay-modal-cash-received');
    const subtotal = this.cart.reduce((a, b) => a + b.subtotal, 0);
    if (!input) return;

    if (amount === 'exact') {
      input.value = subtotal.toFixed(2);
    } else {
      input.value = Number(amount).toFixed(2);
    }
    this.updateChangeCalculation();
  },

  updateChangeCalculation() {
    const subtotal = this.cart.reduce((a, b) => a + b.subtotal, 0);
    const input = document.getElementById('pay-modal-cash-received');
    const changeDisplay = document.getElementById('pay-modal-change-display');
    const confirmBtn = document.getElementById('pay-confirm-submit-btn');

    const method = this.selectedPaymentMethod || 'Pago Móvil';

    if (method === 'Efectivo USD ($)' || method === 'Efectivo Bs.') {
      const received = parseFloat(input ? input.value : 0) || 0;
      const change = received - subtotal;
      if (changeDisplay) {
        if (change < -0.001) {
          changeDisplay.textContent = `Faltante: ${formatUSD(Math.abs(change))}`;
          changeDisplay.className = 'font-bold text-danger font-mono';
          if (confirmBtn) confirmBtn.disabled = true;
        } else {
          changeDisplay.textContent = formatUSD(change);
          changeDisplay.className = 'font-bold text-success font-mono';
          if (confirmBtn) confirmBtn.disabled = false;
        }
      }
    } else {
      if (changeDisplay) {
        changeDisplay.textContent = '$0.00 (Electrónico)';
        changeDisplay.className = 'font-bold text-accent font-mono';
      }
      if (confirmBtn) confirmBtn.disabled = false;
    }
  },

  confirmSale() {
    const subtotal = this.cart.reduce((a, b) => a + b.subtotal, 0);
    const clientSelect = document.getElementById('pos-client-select');
    const clientId = clientSelect ? parseInt(clientSelect.value) : 1;
    const clients = StoreManager.getClients();
    const client = clients.find(c => c.id === clientId) || clients[0];

    const sales = StoreManager.getSales();
    const nextInvoiceNumber = `BM-${String(1000 + sales.length + 1).padStart(6, '0')}`;

    let reference = '';
    const method = this.selectedPaymentMethod || 'Pago Móvil';
    if (method === 'Pago Móvil' || method === 'Transferencia Bs.') {
      const el = document.getElementById('pm-ref-input');
      reference = el ? el.value.trim() : '';
    } else if (method === 'Punto de Venta') {
      const el = document.getElementById('point-ref-input');
      reference = el ? el.value.trim() : '';
    } else if (method === 'Zelle') {
      const el = document.getElementById('zelle-ref-input');
      reference = el ? el.value.trim() : '';
    }

    const rate = StoreManager.getExchangeRate();
    const newSale = {
      id: Date.now(),
      invoiceNumber: nextInvoiceNumber,
      date: new Date().toISOString(),
      clientId: client.id,
      clientName: client.name,
      clientDoc: client.document,
      itemsCount: this.cart.reduce((a, b) => a + b.qty, 0),
      subtotal: subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
      exchangeRate: rate,
      totalVES: subtotal * rate,
      paymentMethod: method,
      reference: reference,
      caja: this.currentUser.caja || 'Caja Principal',
      user: this.currentUser.username,
      items: this.cart.map(i => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        subtotal: i.subtotal
      }))
    };

    StoreManager.recordSale(newSale);
    document.getElementById('checkout-dialog').close();
    this.showToast(`Comprobante ${nextInvoiceNumber} emitido exitosamente`, 'success');
    this.showReceiptModal(nextInvoiceNumber);
    this.clearCart(false);
    this.renderPosProducts();
    this.updateBadges();
  },

  showReceiptModal(invoiceNumber) {
    const sales = StoreManager.getSales();
    const sale = sales.find(s => s.invoiceNumber === invoiceNumber);
    if (!sale) return;

    const paper = document.getElementById('thermal-receipt-content');
    if (!paper) return;

    const rate = sale.exchangeRate || StoreManager.getExchangeRate();

    paper.innerHTML = `
      <div class="ticket-header">
        <div class="ticket-title">BICICLETAS MEJÍA, C.A.</div>
        <div class="font-bold">RIF: J-41235678-0</div>
        <div>Av. 5 de Julio (Calle 77) con Av. 15 Delicias</div>
        <div>Maracaibo, Edo. Zulia · Tel: 0261-7984080 / 0414-2345678</div>
        <div class="text-xs" style="margin-top: 4px;">COMPROBANTE NO FISCAL DE CAJA</div>
      </div>

      <div class="ticket-divider"></div>

      <div class="ticket-row">
        <span>COMPROBANTE N°:</span>
        <span class="font-bold">${sale.invoiceNumber}</span>
      </div>
      <div class="ticket-row">
        <span>FECHA Y HORA:</span>
        <span>${new Date(sale.date).toLocaleString('es-VE')}</span>
      </div>
      <div class="ticket-row">
        <span>CAJA / CAJERO:</span>
        <span>${sale.user} (${sale.caja})</span>
      </div>
      <div class="ticket-row">
        <span>CLIENTE:</span>
        <span class="font-bold">${sale.clientName}</span>
      </div>
      <div class="ticket-row">
        <span>CÉDULA / RIF:</span>
        <span>${sale.clientDoc || 'V-00000000'}</span>
      </div>
      <div class="ticket-row">
        <span>TASA OFICIAL BCV:</span>
        <span class="font-bold font-mono">Bs. ${rate.toFixed(2)} / USD</span>
      </div>

      <div class="ticket-divider"></div>

      <div style="display: grid; grid-template-columns: 2.2fr 0.8fr 1.2fr; font-weight: bold; margin-bottom: 4px; font-size: 11px;">
        <span>DESCRIPCIÓN</span>
        <span style="text-align: center;">CANT</span>
        <span style="text-align: right;">TOTAL ($)</span>
      </div>

      ${sale.items.map(item => `
        <div style="display: grid; grid-template-columns: 2.2fr 0.8fr 1.2fr; margin-bottom: 3px; font-size: 11px;">
          <span>${item.name}</span>
          <span style="text-align: center;">${item.qty}</span>
          <span style="text-align: right;" class="font-mono">${formatUSD(item.subtotal)}</span>
        </div>
      `).join('')}

      <div class="ticket-divider"></div>

      <div class="ticket-row">
        <span>SUBTOTAL ($ USD):</span>
        <span class="font-mono">${formatUSD(sale.subtotal)}</span>
      </div>
      <div class="ticket-row">
        <span>IVA EXENTO:</span>
        <span class="font-mono">$0.00</span>
      </div>
      <div class="ticket-row ticket-total" style="margin: 6px 0; font-size: 14px;">
        <span>TOTAL FACTURA:</span>
        <span class="font-mono">${formatUSD(sale.total)}</span>
      </div>
      <div class="ticket-row" style="background-color: rgba(0,0,0,0.04); padding: 4px 6px; border-radius: 4px; margin-bottom: 6px;">
        <span class="font-bold">EQUIVALENTE BCV (Bs.):</span>
        <span class="font-bold font-mono text-primary">${formatVES(sale.total)}</span>
      </div>
      <div class="ticket-row">
        <span>FORMA DE PAGO:</span>
        <span class="font-bold">${sale.paymentMethod}</span>
      </div>
      ${sale.reference ? `
      <div class="ticket-row">
        <span>REFERENCIA / LOTE:</span>
        <span class="font-mono font-bold">${sale.reference}</span>
      </div>` : ''}

      <div class="ticket-divider"></div>

      <div style="text-align: center; font-size: 10px; line-height: 1.4; margin-top: 8px;">
        ¡Gracias por su compra en Bicicletas Mejía!<br/>
        Bicicletas, repuestos y accesorios originales garantizados.<br/>
        Conserve este comprobante para reclamos y garantías.
      </div>
    `;

    const dialog = document.getElementById('receipt-dialog');
    if (dialog) dialog.showModal();
  },

  printReceipt() {
    window.print();
  },

  // ══════════════════════════════════════════════════════════
  // 2B. MI TURNO Y CONTROL DE GAVETA (ARQUEO DE CAJA)
  // ══════════════════════════════════════════════════════════
  renderShift() {
    const caja = this.currentUser.caja || 'Caja Principal';
    const activeShift = StoreManager.getActiveShift(caja);

    const activePanel = document.getElementById('shift-active-panel');
    const closedPanel = document.getElementById('shift-closed-panel');
    const headerStatus = document.getElementById('shift-header-status');
    const badgeStatus = document.getElementById('shift-badge-status');

    if (!activeShift) {
      if (activePanel) activePanel.style.display = 'none';
      if (closedPanel) closedPanel.style.display = 'block';
      if (headerStatus) headerStatus.textContent = `Terminal: ${caja} · Responsable: ${this.currentUser.name} · Sin turno abierto`;
      if (badgeStatus) {
        badgeStatus.textContent = 'Turno Cerrado';
        badgeStatus.className = 'badge badge-neutral';
      }
      this.updateShiftSummary(0, 0, 0, 0, 0);
    } else {
      if (activePanel) activePanel.style.display = 'block';
      if (closedPanel) closedPanel.style.display = 'none';
      const openTime = new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (headerStatus) {
        headerStatus.textContent = `Terminal: ${caja} · Responsable: ${activeShift.cashierName || this.currentUser.name} · Abierto desde las ${openTime}`;
      }
      if (badgeStatus) {
        badgeStatus.textContent = 'Turno Abierto';
        badgeStatus.className = 'badge badge-success';
      }

      const baseCash = activeShift.baseCash || 0;
      const cashSales = activeShift.cashSales || 0;
      const expectedCash = baseCash + cashSales;
      const electronicSales = activeShift.electronicSales || 0;
      const salesCount = activeShift.salesCount || 0;

      this.updateShiftSummary(baseCash, cashSales, expectedCash, electronicSales, salesCount);

      const input = document.getElementById('shift-counted-input');
      if (input && !input.value) {
        this.onShiftCashCountInput('');
      } else if (input && input.value) {
        this.onShiftCashCountInput(input.value);
      }
    }

    this.renderShiftsHistory();
  },

  updateShiftSummary(base, cashSales, expected, electronic, count) {
    const baseEl = document.getElementById('shift-base-cash');
    const cashEl = document.getElementById('shift-cash-sales');
    const expEl = document.getElementById('shift-expected-cash');
    const elecEl = document.getElementById('shift-electronic-sales');
    const countEl = document.getElementById('shift-sales-count');
    const reconcileExpEl = document.getElementById('shift-reconcile-expected');

    if (baseEl) baseEl.textContent = formatMoney(base);
    if (cashEl) cashEl.textContent = formatMoney(cashSales);
    if (expEl) expEl.textContent = formatMoney(expected);
    if (elecEl) elecEl.textContent = formatMoney(electronic);
    if (countEl) countEl.textContent = `${count} cobros registrados`;
    if (reconcileExpEl) reconcileExpEl.textContent = formatMoney(expected);
  },

  openShortcutsModal() {
    const dialog = document.getElementById('shortcuts-dialog');
    if (dialog) dialog.showModal();
  },

  updateExchangeRateUI() {
    const rate = StoreManager.getExchangeRate();
    const formatted = `Bs. ${rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const topbarRate = document.getElementById('topbar-bcv-rate');
    if (topbarRate) {
      topbarRate.textContent = formatted;
    }
    const adminRate = document.getElementById('admin-settings-rate-display');
    if (adminRate) {
      adminRate.textContent = `${formatted} por USD`;
    }
  },

  openExchangeRateModal() {
    if (this.currentUser && this.currentUser.role !== 'admin') {
      this.showToast('Solo el administrador puede actualizar la tasa oficial de cambio.', 'warning');
      return;
    }
    const rate = StoreManager.getExchangeRate();
    const input = document.getElementById('input-exchange-rate');
    if (input) input.value = rate.toFixed(2);
    const dialog = document.getElementById('exchange-rate-dialog');
    if (dialog) dialog.showModal();
  },

  saveExchangeRate(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('input-exchange-rate');
    if (!input) return;
    const newRate = parseFloat(input.value);
    if (!newRate || newRate <= 0) {
      this.showToast('Por favor ingrese una tasa válida', 'error');
      return;
    }
    StoreManager.setExchangeRate(newRate);
    this.updateExchangeRateUI();
    const dialog = document.getElementById('exchange-rate-dialog');
    if (dialog) dialog.close();
    this.showToast(`Tasa oficial actualizada a Bs. ${newRate.toFixed(2)} / USD`, 'success');

    this.renderCart();
    this.renderPosProducts();
    if (this.currentView === 'shift') this.renderShift();
  },

  calcDenominations() {
    const rate = StoreManager.getExchangeRate();
    const inputs = document.querySelectorAll('.denom-qty');
    let totalUSD = 0;
    let totalVES = 0;

    inputs.forEach(inp => {
      const val = parseFloat(inp.dataset.val) || 0;
      const cur = inp.dataset.cur || 'usd';
      const qty = parseInt(inp.value) || 0;
      const sub = val * qty;

      if (cur === 'usd') {
        totalUSD += sub;
        const subEl = document.getElementById('denom-sub-' + val);
        if (subEl) subEl.textContent = formatUSD(sub);
      } else {
        totalVES += sub;
        const subEl = document.getElementById('denom-sub-bs-' + val);
        if (subEl) {
          subEl.textContent = 'Bs. ' + sub.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
    });

    const convertedVESInUSD = rate > 0 ? (totalVES / rate) : 0;
    const grandTotalUSD = totalUSD + convertedVESInUSD;

    const countedInput = document.getElementById('shift-counted-input');
    if (countedInput) {
      countedInput.value = grandTotalUSD > 0 ? grandTotalUSD.toFixed(2) : '';
      this.onShiftCashCountInput(grandTotalUSD > 0 ? grandTotalUSD.toFixed(2) : '');
    }
  },

  onShiftCashCountInput(val) {
    const caja = this.currentUser.caja || 'Caja Principal';
    const activeShift = StoreManager.getActiveShift(caja);
    const expected = activeShift ? (activeShift.baseCash || 0) + (activeShift.cashSales || 0) : 0;

    const countedEl = document.getElementById('shift-reconcile-counted');
    const diffBadge = document.getElementById('shift-diff-badge');

    if (!val || isNaN(parseFloat(val))) {
      if (countedEl) countedEl.textContent = '$0';
      if (diffBadge) {
        diffBadge.textContent = 'Pendiente de Conteo';
        diffBadge.className = 'badge badge-neutral font-mono font-bold';
      }
      return;
    }

    const counted = parseFloat(val);
    if (countedEl) countedEl.textContent = formatMoney(counted);

    const diff = counted - expected;
    if (diff === 0) {
      if (diffBadge) {
        diffBadge.textContent = 'Cuadrado exacto ($0)';
        diffBadge.className = 'badge badge-success font-mono font-bold';
      }
    } else if (diff < 0) {
      if (diffBadge) {
        diffBadge.textContent = `Faltante de caja: -${formatMoney(Math.abs(diff))}`;
        diffBadge.className = 'badge badge-danger font-mono font-bold';
      }
    } else {
      if (diffBadge) {
        diffBadge.textContent = `Sobrante de caja: +${formatMoney(diff)}`;
        diffBadge.className = 'badge badge-info font-mono font-bold';
      }
    }
  },

  executeShiftClose() {
    const caja = this.currentUser.caja || 'Caja Principal';
    const activeShift = StoreManager.getActiveShift(caja);
    if (!activeShift) {
      this.showToast('No hay un turno abierto para esta caja.', 'warning');
      return;
    }

    const countedInput = document.getElementById('shift-counted-input');
    const val = countedInput ? countedInput.value.trim() : '';
    if (!val) {
      alert('Debe ingresar el valor del efectivo físico contado antes de efectuar el cierre.');
      if (countedInput) countedInput.focus();
      return;
    }

    const countedCash = parseFloat(val) || 0;
    const notes = document.getElementById('shift-notes-input') ? document.getElementById('shift-notes-input').value.trim() : '';

    const expectedCash = (activeShift.baseCash || 0) + (activeShift.cashSales || 0);
    const diff = countedCash - expectedCash;
    let diffMsg = 'Caja cuadrada exactamente ($0).';
    if (diff < 0) diffMsg = `ALERTA: Se registra un faltante de ${formatMoney(Math.abs(diff))}.`;
    if (diff > 0) diffMsg = `AVISO: Se registra un sobrante de ${formatMoney(diff)}.`;

    if (!confirm(`¿Confirma el cierre definitivo del turno?\n\nBase: ${formatMoney(activeShift.baseCash)}\nVentas Efectivo: ${formatMoney(activeShift.cashSales)}\nTotal Esperado: ${formatMoney(expectedCash)}\nTotal Físico Contado: ${formatMoney(countedCash)}\n\n${diffMsg}`)) {
      return;
    }

    const closed = StoreManager.closeShift(activeShift.id, countedCash, notes);
    this.showToast('Turno cerrado y arqueo registrado correctamente.', 'success');

    // Imprimir o mostrar Comprobante de Cierre Z
    this.showShiftReportReceipt(closed, 'CIERRE DEFINITIVO DE CAJA (CORTE Z)');

    if (countedInput) countedInput.value = '';
    const notesInput = document.getElementById('shift-notes-input');
    if (notesInput) notesInput.value = '';

    this.renderShift();
  },

  executeShiftOpen() {
    const caja = this.currentUser.caja || 'Caja Principal';
    const baseInput = document.getElementById('new-shift-base-cash');
    const baseCash = baseInput ? parseFloat(baseInput.value) || 0 : 150000;

    const newShift = {
      id: Date.now(),
      caja: caja,
      username: this.currentUser.username,
      cashierName: this.currentUser.name,
      startTime: new Date().toISOString(),
      baseCash: baseCash,
      status: 'abierto',
      closedTime: null,
      salesCount: 0,
      cashSales: 0,
      electronicSales: 0,
      countedCash: null,
      difference: null
    };

    StoreManager.openShift(newShift);
    this.showToast(`Turno aperturado en ${caja} con base de ${formatMoney(baseCash)}`, 'success');
    this.renderShift();
  },

  printPreShiftSummary() {
    const caja = this.currentUser.caja || 'Caja Principal';
    const activeShift = StoreManager.getActiveShift(caja);
    if (!activeShift) {
      this.showToast('No hay turno abierto para imprimir arqueo previo.', 'warning');
      return;
    }
    this.showShiftReportReceipt(activeShift, 'ARQUEO PARCIAL DE CAJA (CORTE X)');
  },

  showShiftReportReceipt(shift, reportTitle) {
    const paper = document.getElementById('thermal-receipt-content');
    if (!paper) return;

    const rate = StoreManager.getExchangeRate();
    const base = shift.baseCash || 0;
    const cash = shift.cashSales || 0;
    const expected = base + cash;
    const elec = shift.electronicSales || 0;
    const counted = shift.countedCash !== null ? shift.countedCash : expected;
    const diff = shift.difference !== null ? shift.difference : (counted - expected);

    paper.innerHTML = `
      <div class="ticket-header">
        <div class="ticket-title">BICICLETAS MEJÍA, C.A.</div>
        <div class="font-bold">RIF: J-41235678-0</div>
        <div>Av. 5 de Julio (Calle 77) con Av. 15 Delicias</div>
        <div>Maracaibo, Edo. Zulia · Tel: 0261-7984080</div>
        <div style="margin-top: 6px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 0;">
          ${reportTitle}
        </div>
      </div>

      <div class="ticket-meta" style="margin-top: 8px;">
        <div class="ticket-row"><span>Terminal:</span><span>${shift.caja}</span></div>
        <div class="ticket-row"><span>Cajero:</span><span>${shift.cashierName || shift.username}</span></div>
        <div class="ticket-row"><span>Tasa BCV del Turno:</span><span class="font-mono font-bold">Bs. ${rate.toFixed(2)}</span></div>
        <div class="ticket-row"><span>Apertura:</span><span>${new Date(shift.startTime).toLocaleString('es-VE')}</span></div>
        ${shift.closedTime ? `<div class="ticket-row"><span>Cierre:</span><span>${new Date(shift.closedTime).toLocaleString('es-VE')}</span></div>` : ''}
        <div class="ticket-row"><span>Estado:</span><span>${(shift.status || 'abierto').toUpperCase()}</span></div>
      </div>

      <div class="ticket-divider"></div>

      <div style="font-size: 11px; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between;">
          <span>(+) Base de Caja (Fondo inicial):</span>
          <span class="font-mono">${formatUSD(base)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>(+) Ventas Efectivo ($ USD):</span>
          <span class="font-mono">${formatUSD(cash)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; padding-top: 2px;">
          <span>(=) Total Teórico Gaveta ($ USD):</span>
          <span class="font-mono">${formatUSD(expected)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px;">
          <span>Ventas Electrónicas (Pago Móvil/Punto/Zelle):</span>
          <span class="font-mono">${formatUSD(elec)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>TOTAL FACTURADO EN TURNO:</span>
          <span class="font-mono">${formatUSD(cash + elec)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #555; font-size: 10px;">
          <span>Equivalente Total Facturado (Bs.):</span>
          <span class="font-mono">${formatVES(cash + elec)}</span>
        </div>
      </div>

      <div class="ticket-divider"></div>

      <div style="font-size: 11px; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Efectivo Físico Contado ($ USD):</span>
          <span class="font-mono">${shift.countedCash !== null ? formatUSD(counted) : 'No auditado (Parcial)'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Diferencia de Caja:</span>
          <span class="font-mono">${diff === 0 ? '$0.00 (Cuadrada)' : (diff < 0 ? `-${formatUSD(Math.abs(diff))} (Faltante)` : `+${formatUSD(diff)} (Sobrante)`)}</span>
        </div>
        ${shift.notes ? `<div style="margin-top: 6px; font-style: italic;">Notas: ${shift.notes}</div>` : ''}
      </div>

      <div class="ticket-footer" style="margin-top: 15px;">
        <div style="border-top: 1px dashed #000; margin-top: 25px; padding-top: 4px;">
          Firma Responsable de Caja
        </div>
      </div>
    `;

    const dialog = document.getElementById('receipt-dialog');
    if (dialog) dialog.showModal();
  },

  renderShiftsHistory() {
    const tbody = document.getElementById('shifts-history-tbody');
    if (!tbody) return;

    const shifts = StoreManager.getShifts();
    if (shifts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 1.5rem;">No hay registros de turnos previos.</td></tr>`;
      return;
    }

    tbody.innerHTML = shifts.map(s => {
      const isClosed = s.status === 'cerrado';
      const expected = (s.baseCash || 0) + (s.cashSales || 0);
      const diff = s.difference;
      let diffHtml = '<span class="text-muted font-mono">--</span>';
      if (diff !== null && diff !== undefined) {
        if (diff === 0) {
          diffHtml = '<span class="text-success font-mono font-bold">$0</span>';
        } else if (diff < 0) {
          diffHtml = `<span class="text-danger font-mono font-bold">-${formatMoney(Math.abs(diff))}</span>`;
        } else {
          diffHtml = `<span class="text-info font-mono font-bold">+${formatMoney(diff)}</span>`;
        }
      }

      return `
        <tr>
          <td>
            <div class="font-semibold">${new Date(s.startTime).toLocaleDateString()}</div>
            <div class="text-xs text-muted font-mono">${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </td>
          <td>
            <div class="font-semibold text-primary">${s.caja}</div>
            <div class="text-xs text-muted">${s.cashierName || s.username}</div>
          </td>
          <td class="font-mono text-right text-muted">${formatMoney(s.baseCash)}</td>
          <td class="font-mono text-right font-semibold text-primary">${formatMoney(s.cashSales)}</td>
          <td class="font-mono text-right">${diffHtml}</td>
          <td>
            <span class="badge ${isClosed ? 'badge-neutral' : 'badge-success'}">${isClosed ? 'Cerrado' : 'Abierto'}</span>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ══════════════════════════════════════════════════════════
  // 3. INVENTARIO
  // ══════════════════════════════════════════════════════════
  renderInventory() {
    const role = this.currentUser.role || 'admin';
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
    const products = StoreManager.getProducts();
    const categories = StoreManager.getCategories();

    // 1. Acciones de cabecera: En inventario solo se crea catálogo; las compras/entradas tienen su módulo dedicado
    const invActionsHeader = document.querySelector('#view-inventory .page-actions');
    if (invActionsHeader) {
      if (config.canCreateProduct) {
        invActionsHeader.innerHTML = `
          <button class="btn btn-primary" onclick="App.openNewProductModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo producto
          </button>
        `;
      } else {
        invActionsHeader.innerHTML = '';
      }
    }

    // 2. Columna Costo: Si el rol no tiene permiso, la columna NO existe en la tabla
    const thCost = document.getElementById('th-inv-cost');
    if (thCost) {
      thCost.style.display = config.canCreateProduct ? '' : 'none';
    }

    const catSelect = document.getElementById('inv-category-filter');
    if (catSelect && catSelect.children.length <= 1) {
      catSelect.innerHTML = `<option value="all">Todas las categorías</option>` +
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    let filtered = products;

    if (this.inventoryFilterCategory !== 'all') {
      filtered = filtered.filter(p => p.categoryId === parseInt(this.inventoryFilterCategory));
    }

    if (this.inventoryFilterStock === 'low') {
      filtered = filtered.filter(p => p.unit !== 'SRV' && p.stock <= p.minStock);
    } else if (this.inventoryFilterStock === 'out') {
      filtered = filtered.filter(p => p.unit !== 'SRV' && p.stock === 0);
    }

    if (this.inventorySearchQuery) {
      const q = this.inventorySearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    }

    const tbody = document.getElementById('inventory-tbody');
    const countDisplay = document.getElementById('inventory-total-count');
    if (countDisplay) {
      countDisplay.textContent = `${filtered.length} referencias registradas`;
    }

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${config.canCreateProduct ? 8 : 7}" class="text-center text-muted" style="padding: 2.5rem;">
            No se encontraron productos registrados con los filtros aplicados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const isLow = p.unit !== 'SRV' && p.stock <= p.minStock;
      const isOut = p.unit !== 'SRV' && p.stock <= 0;
      const margin = p.costPrice > 0 ? Math.round(((p.salePrice - p.costPrice) / p.salePrice) * 100) : 0;

      // Botones de acción según permisos de rol
      let actionButtons = `
        <button class="btn btn-sm btn-secondary btn-icon" title="Código de Barras" onclick="App.showBarcodePreview('${p.barcode}', '${p.name}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8v8M11 8v8M15 8v8M17 8v8"/></svg>
        </button>
      `;

      if (config.canEditProduct) {
        actionButtons += `
          <button class="btn btn-sm btn-secondary btn-icon" title="Editar Producto" onclick="App.openEditProductModal(${p.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        `;
      }

      if (config.canDeleteProduct) {
        actionButtons += `
          <button class="btn btn-sm btn-danger btn-icon" title="Eliminar" onclick="App.deleteProduct(${p.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        `;
      }

      return `
        <tr>
          <td>
            <div class="font-semibold text-primary">${p.name}</div>
            <div class="text-xs text-muted font-mono">${p.sku}</div>
          </td>
          <td><span class="font-mono text-xs text-secondary">${p.barcode}</span></td>
          <td><span class="badge badge-neutral">${p.categoryName}</span></td>
          ${config.canCreateProduct ? `<td class="font-mono text-muted text-right">${formatMoney(p.costPrice)}</td>` : ''}
          <td class="font-mono font-bold text-primary text-right">
            ${formatMoney(p.salePrice)}
            ${config.canCreateProduct ? `<div class="text-xs text-muted" style="font-size: 10px;">${margin}% margen</div>` : ''}
          </td>
          <td>
            ${p.unit === 'SRV'
              ? `<span class="badge badge-info">Servicio</span>`
              : `
                <div class="stock-bar" style="width: 100px;">
                  <div class="stock-bar-track">
                    <div class="stock-bar-fill ${isOut ? 'low' : (isLow ? 'mid' : 'high')}" style="width: ${Math.min(100, Math.max(10, (p.stock / 15) * 100))}%;"></div>
                  </div>
                  <span class="stock-bar-value ${isOut ? 'text-danger' : (isLow ? 'text-warning' : 'text-primary')}">
                    ${p.stock}
                  </span>
                </div>
                <div class="text-xs text-muted" style="font-size: 10px;">Mín: ${p.minStock} ${p.unit}</div>
              `
            }
          </td>
          <td>
            ${isOut
              ? `<span class="badge badge-danger">Agotado</span>`
              : (isLow ? `<span class="badge badge-warning">Stock Bajo</span>` : `<span class="badge badge-success">Normal</span>`)
            }
          </td>
          <td class="text-right">
            <div style="display: flex; gap: 4px; justify-content: flex-end;">
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  onInventorySearch(val) {
    this.inventorySearchQuery = val;
    this.renderInventory();
  },

  onInventoryCategoryChange(val) {
    this.inventoryFilterCategory = val;
    this.renderInventory();
  },

  onInventoryStockFilterChange(val) {
    this.inventoryFilterStock = val;
    this.renderInventory();
  },

  openNewProductModal() {
    const role = this.currentUser.role || 'admin';
    if (!ROLE_CONFIG[role].canCreateProduct) {
      this.showToast('Permiso denegado: El rol Cajero no puede crear productos.', 'warning');
      return;
    }

    const dialog = document.getElementById('product-form-dialog');
    document.getElementById('product-form-title').textContent = 'Nuevo producto';
    document.getElementById('product-id-input').value = '';
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-barcode').value = '770' + Math.floor(1000000 + Math.random() * 9000000);
    document.getElementById('prod-sku').value = 'PROD-' + Math.floor(100 + Math.random() * 900);
    document.getElementById('prod-cost').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-stock').value = '10';
    document.getElementById('prod-min-stock').value = '3';

    const catSelect = document.getElementById('prod-category');
    catSelect.innerHTML = StoreManager.getCategories().map(c => `
      <option value="${c.id}">${c.name}</option>
    `).join('');

    if (dialog) dialog.showModal();
  },

  openEditProductModal(id) {
    const role = this.currentUser.role || 'admin';
    if (!ROLE_CONFIG[role].canEditProduct) {
      this.showToast('Permiso denegado: No tiene autorización para editar artículos.', 'warning');
      return;
    }

    const products = StoreManager.getProducts();
    const p = products.find(x => x.id === id);
    if (!p) return;

    const dialog = document.getElementById('product-form-dialog');
    document.getElementById('product-form-title').textContent = 'Editar producto';
    document.getElementById('product-id-input').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-barcode').value = p.barcode;
    document.getElementById('prod-sku').value = p.sku;
    document.getElementById('prod-cost').value = p.costPrice;
    document.getElementById('prod-price').value = p.salePrice;
    document.getElementById('prod-stock').value = p.stock;
    document.getElementById('prod-min-stock').value = p.minStock;

    const catSelect = document.getElementById('prod-category');
    catSelect.innerHTML = StoreManager.getCategories().map(c => `
      <option value="${c.id}" ${c.id === p.categoryId ? 'selected' : ''}>${c.name}</option>
    `).join('');

    if (dialog) dialog.showModal();
  },

  saveProductForm(e) {
    e.preventDefault();
    const idInput = document.getElementById('product-id-input').value;
    const products = StoreManager.getProducts();
    const categories = StoreManager.getCategories();
    const catId = parseInt(document.getElementById('prod-category').value);
    const cat = categories.find(c => c.id === catId);

    const productData = {
      name: document.getElementById('prod-name').value.trim(),
      barcode: document.getElementById('prod-barcode').value.trim(),
      sku: document.getElementById('prod-sku').value.trim(),
      categoryId: catId,
      categoryName: cat ? cat.name : 'Varios',
      costPrice: parseFloat(document.getElementById('prod-cost').value) || 0,
      salePrice: parseFloat(document.getElementById('prod-price').value) || 0,
      stock: parseInt(document.getElementById('prod-stock').value) || 0,
      minStock: parseInt(document.getElementById('prod-min-stock').value) || 0,
      unit: document.getElementById('prod-unit').value || 'UND',
      active: true
    };

    if (idInput) {
      const index = products.findIndex(p => p.id === parseInt(idInput));
      if (index > -1) {
        products[index] = { ...products[index], ...productData };
        this.showToast('Producto actualizado correctamente', 'success');
      }
    } else {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      products.push({ id: newId, ...productData });
      this.showToast('Producto registrado en inventario', 'success');
    }

    StoreManager.saveProducts(products);
    document.getElementById('product-form-dialog').close();
    this.renderInventory();
    this.updateBadges();
  },

  deleteProduct(id) {
    const role = this.currentUser.role || 'admin';
    if (!ROLE_CONFIG[role].canDeleteProduct) {
      this.showToast('Permiso denegado: Solo el Administrador puede eliminar artículos.', 'warning');
      return;
    }

    if (!confirm('¿Desea dar de baja este producto del catálogo?')) return;
    const products = StoreManager.getProducts().filter(p => p.id !== id);
    StoreManager.saveProducts(products);
    this.showToast('Producto dado de baja', 'info');
    this.renderInventory();
    this.updateBadges();
  },

  showBarcodePreview(barcode, name) {
    alert(`Código de barras:\n\nArtículo: ${name}\nCódigo EAN/UPC: ${barcode}\n\nListo para emisión de etiquetas.`);
  },

  // ══════════════════════════════════════════════════════════
  // 4. COMPRAS Y RECEPCIÓN DE PEDIDOS
  // ══════════════════════════════════════════════════════════
  renderPurchases() {
    const purchases = StoreManager.getPurchases();
    const tbody = document.getElementById('purchases-tbody');
    if (!tbody) return;

    tbody.innerHTML = purchases.map(p => `
      <tr>
        <td><span class="font-mono text-accent font-semibold">${p.orderNumber}</span></td>
        <td><span class="font-semibold text-primary">${p.supplierName}</span></td>
        <td><span class="text-xs text-muted">${new Date(p.date).toLocaleDateString()}</span></td>
        <td><span class="text-xs text-secondary">${p.itemsSummary || 'Componentes de reposición'}</span></td>
        <td class="font-mono font-bold text-primary text-right">${formatMoney(p.total)}</td>
        <td><span class="badge badge-success">${p.status}</span></td>
        <td class="text-right">
          <button class="btn btn-sm btn-secondary" onclick="App.showToast('Comprobante ${p.orderNumber} verificado', 'info')">
            Detalle
          </button>
        </td>
      </tr>
    `).join('');
  },

  openNewPurchaseModal() {
    const role = this.currentUser.role || 'admin';
    if (!ROLE_CONFIG[role].canReceiveStock) {
      this.showToast('Permiso denegado: Solo almacén y administración pueden registrar compras.', 'warning');
      return;
    }

    const dialog = document.getElementById('purchase-dialog');
    const supSelect = document.getElementById('purchase-supplier-select');
    const prodSelect = document.getElementById('purchase-product-select');

    if (supSelect) {
      supSelect.innerHTML = StoreManager.getSuppliers().map(s => `
        <option value="${s.id}">${s.name}</option>
      `).join('');
    }

    if (prodSelect) {
      prodSelect.innerHTML = StoreManager.getProducts().map(p => `
        <option value="${p.id}" data-cost="${p.costPrice}">${p.name} (Stock: ${p.stock})</option>
      `).join('');
    }

    if (dialog) dialog.showModal();
  },

  openPurchaseForProduct(productId) {
    this.openNewPurchaseModal();
    const prodSelect = document.getElementById('purchase-product-select');
    if (prodSelect) {
      prodSelect.value = productId;
    }
  },

  confirmNewPurchase(e) {
    e.preventDefault();
    const supId = parseInt(document.getElementById('purchase-supplier-select').value);
    const prodId = parseInt(document.getElementById('purchase-product-select').value);
    const qty = parseInt(document.getElementById('purchase-qty').value) || 1;
    const cost = parseFloat(document.getElementById('purchase-unit-cost').value) || 0;

    const suppliers = StoreManager.getSuppliers();
    const supplier = suppliers.find(s => s.id === supId) || suppliers[0];
    const products = StoreManager.getProducts();
    const product = products.find(p => p.id === prodId);

    const total = qty * cost;
    const orderNumber = `OC-2024-${String(200 + StoreManager.getPurchases().length + 1).padStart(5, '0')}`;

    const purchaseData = {
      id: Date.now(),
      orderNumber,
      supplierName: supplier.name,
      date: new Date().toISOString(),
      total,
      status: 'Recibido en Bodega',
      itemsSummary: `${qty}x ${product ? product.name : 'Artículo'}`,
      receivedBy: this.currentUser.name
    };

    StoreManager.recordPurchase(purchaseData, [{ productId: prodId, qty, costPrice: cost }]);

    document.getElementById('purchase-dialog').close();
    this.showToast(`Entrada ${orderNumber} confirmada. Stock incrementado (+${qty})`, 'success');
    this.renderPurchases();
    this.updateBadges();
  },

  // ══════════════════════════════════════════════════════════
  // 5. CLIENTES
  // ══════════════════════════════════════════════════════════
  filterClients(query) {
    this.clientSearchQuery = (query || '').toLowerCase().trim();
    this.renderClients();
  },

  renderClients() {
    let clients = StoreManager.getClients();
    const tbody = document.getElementById('clients-tbody');
    if (!tbody) return;

    if (this.clientSearchQuery) {
      clients = clients.filter(c =>
        (c.name && c.name.toLowerCase().includes(this.clientSearchQuery)) ||
        (c.document && c.document.toLowerCase().includes(this.clientSearchQuery)) ||
        (c.phone && c.phone.toLowerCase().includes(this.clientSearchQuery)) ||
        (c.email && c.email.toLowerCase().includes(this.clientSearchQuery))
      );
    }

    if (clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 24px;">No se encontraron clientes coincidentes</td></tr>';
      return;
    }

    tbody.innerHTML = clients.map(c => `
      <tr>
        <td>
          <div class="font-semibold text-primary">${c.name}</div>
          <div class="text-xs text-muted">${c.email || 'Sin correo'}</div>
        </td>
        <td><span class="font-mono text-secondary">${c.document}</span></td>
        <td>${c.phone}</td>
        <td><span class="text-xs text-muted">${c.address || 'Maracaibo, Edo. Zulia'}</span></td>
        <td><span class="badge badge-neutral">${c.purchasesCount || 0} compras</span></td>
        <td class="text-right">
          <button class="btn btn-sm btn-secondary" onclick="App.showToast('Historial cargado para ${c.name}', 'info')">
            Historial
          </button>
        </td>
      </tr>
    `).join('');
  },

  openNewClientModal() {
    const dialog = document.getElementById('client-dialog');
    if (dialog) dialog.showModal();
  },

  saveClientForm(e) {
    e.preventDefault();
    const name = document.getElementById('client-name').value.trim();
    const doc = document.getElementById('client-doc').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const address = document.getElementById('client-address').value.trim();

    const clients = StoreManager.getClients();
    clients.push({
      id: Date.now(),
      name,
      document: doc,
      phone,
      email,
      address,
      purchasesCount: 0
    });

    StoreManager.saveClients(clients);
    document.getElementById('client-dialog').close();
    this.showToast(`Cliente ${name} registrado`, 'success');
    this.renderClients();
    this.renderPosClientsSelect();
  },

  // ══════════════════════════════════════════════════════════
  // 6. PROVEEDORES
  // ══════════════════════════════════════════════════════════
  filterSuppliers(query) {
    this.supplierSearchQuery = (query || '').toLowerCase().trim();
    this.renderSuppliers();
  },

  renderSuppliers() {
    let suppliers = StoreManager.getSuppliers();
    const tbody = document.getElementById('suppliers-tbody');
    if (!tbody) return;

    if (this.supplierSearchQuery) {
      suppliers = suppliers.filter(s =>
        (s.name && s.name.toLowerCase().includes(this.supplierSearchQuery)) ||
        (s.nit && s.nit.toLowerCase().includes(this.supplierSearchQuery)) ||
        (s.contact && s.contact.toLowerCase().includes(this.supplierSearchQuery)) ||
        (s.phone && s.phone.toLowerCase().includes(this.supplierSearchQuery))
      );
    }

    if (suppliers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 24px;">No se encontraron proveedores coincidentes</td></tr>';
      return;
    }

    tbody.innerHTML = suppliers.map(s => `
      <tr>
        <td>
          <div class="font-semibold text-primary">${s.name}</div>
          <div class="text-xs text-muted font-mono">RIF: ${s.nit}</div>
        </td>
        <td><span class="font-mono text-secondary">${s.nit}</span></td>
        <td>${s.contact}</td>
        <td>${s.phone}</td>
        <td><span class="text-xs text-muted">${s.email}</span></td>
        <td class="text-right">
          <button class="btn btn-sm btn-primary" onclick="App.openNewPurchaseModal()">
            Crear Pedido
          </button>
        </td>
      </tr>
    `).join('');
  },

  openNewSupplierModal() {
    const dialog = document.getElementById('supplier-dialog');
    if (dialog) dialog.showModal();
  },

  saveSupplierForm(e) {
    e.preventDefault();
    const name = document.getElementById('sup-name').value.trim();
    const nit = document.getElementById('sup-nit').value.trim();
    const contact = document.getElementById('sup-contact').value.trim();
    const phone = document.getElementById('sup-phone').value.trim();
    const email = document.getElementById('sup-email').value.trim();

    const suppliers = StoreManager.getSuppliers();
    suppliers.push({
      id: Date.now(),
      name,
      nit,
      contact,
      phone,
      email,
      leadDays: 3
    });
    StoreManager.saveSuppliers(suppliers);

    document.getElementById('supplier-dialog').close();
    this.showToast(`Proveedor ${name} añadido`, 'success');
    this.renderSuppliers();
  },

  // ══════════════════════════════════════════════════════════
  // 7. AJUSTES DE INVENTARIO
  // ══════════════════════════════════════════════════════════
  renderAdjustments() {
    const prodSelect = document.getElementById('adj-product-select');
    if (prodSelect) {
      prodSelect.innerHTML = StoreManager.getProducts().map(p => `
        <option value="${p.id}">${p.name} (Stock: ${p.stock})</option>
      `).join('');
    }

    const tbody = document.getElementById('adjustments-tbody');
    if (tbody) {
      const adjustments = StoreManager.getAdjustments();
      if (adjustments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 24px;">No hay movimientos registrados</td></tr>';
      } else {
        tbody.innerHTML = adjustments.slice(0, 10).map(a => `
          <tr>
            <td class="font-mono text-xs">${new Date(a.date).toLocaleDateString()}</td>
            <td>
              <div class="font-semibold text-primary">${a.productName}</div>
              <div class="text-xs text-muted">${a.user || 'Almacén'}</div>
            </td>
            <td>
              <span class="badge ${a.type === 'salida' ? 'badge-danger' : 'badge-success'}">
                ${a.type === 'salida' ? 'Salida' : 'Entrada'}
              </span>
            </td>
            <td class="text-right font-mono font-bold">${a.qty}</td>
            <td class="text-xs text-muted">${a.reason}</td>
          </tr>
        `).join('');
      }
    }
  },

  saveAdjustment(e) {
    e.preventDefault();
    const role = this.currentUser.role || 'admin';
    if (!ROLE_CONFIG[role].canAdjustStock) {
      this.showToast('Permiso denegado: Solo el personal de Almacén puede hacer ajustes.', 'warning');
      return;
    }

    const prodId = parseInt(document.getElementById('adj-product-select').value);
    const type = document.getElementById('adj-type').value;
    const qty = parseInt(document.getElementById('adj-qty').value) || 0;
    const reason = (document.getElementById('adj-reason').value || '').trim();

    if (qty <= 0) {
      this.showToast('La cantidad debe ser mayor a cero', 'warning');
      return;
    }

    const products = StoreManager.getProducts();
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    if (type === 'salida') {
      if (prod.stock < qty) {
        this.showToast(`Stock insuficiente. Disponible: ${prod.stock}`, 'warning');
        return;
      }
      prod.stock = Math.max(0, prod.stock - qty);
    } else {
      prod.stock += qty;
    }

    StoreManager.saveProducts(products);

    StoreManager.recordAdjustment({
      id: Date.now(),
      date: new Date().toISOString(),
      productId: prod.id,
      productName: prod.name,
      type,
      qty,
      reason: reason || 'Ajuste de inventario',
      user: this.currentUser.name
    });

    this.showToast(`Ajuste registrado para "${prod.name}" (Stock: ${prod.stock})`, 'success');
    this.updateBadges();

    document.getElementById('adj-qty').value = '';
    document.getElementById('adj-reason').value = '';
    this.renderAdjustments();
  },

  // ══════════════════════════════════════════════════════════
  // 8. REPORTES
  // ══════════════════════════════════════════════════════════
  renderReports() {
    const sales = StoreManager.getSales();
    const products = StoreManager.getProducts();

    const totalVentas = sales.reduce((a, s) => a + s.total, 0);
    const totalCosto = products.reduce((a, p) => a + (p.costPrice * (p.unit !== 'SRV' ? p.stock : 0)), 0);

    const repTotalEl = document.getElementById('rep-total-ventas');
    const repItemsEl = document.getElementById('rep-total-transacciones');
    const repInvEl = document.getElementById('rep-total-inventario');

    if (repTotalEl) repTotalEl.textContent = formatMoney(totalVentas);
    if (repItemsEl) repItemsEl.textContent = sales.length;
    if (repInvEl) repInvEl.textContent = formatMoney(totalCosto);

    const catBreakdown = document.getElementById('rep-cat-breakdown');
    if (catBreakdown) {
      const categories = StoreManager.getCategories();
      const totalUnits = products.reduce((sum, p) => sum + (p.unit !== 'SRV' ? p.stock : 0), 0);
      catBreakdown.innerHTML = categories.map(cat => {
        const catProds = products.filter(p => p.categoryId === cat.id);
        const catStockCount = catProds.reduce((sum, p) => sum + (p.unit !== 'SRV' ? p.stock : 0), 0);
        const percent = totalUnits > 0 ? Math.min(100, Math.round((catStockCount / totalUnits) * 100)) : 0;
        return `
          <div style="margin-bottom: 0.85rem;">
            <div class="flex justify-between text-xs mb-1">
              <span class="font-semibold text-primary">${cat.name}</span>
              <span class="text-muted font-mono">${catProds.length} referencias · ${catStockCount} unid. (${percent}%)</span>
            </div>
            <div class="stock-bar-track">
              <div class="stock-bar-fill high" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  exportReportsExcel() {
    const sales = StoreManager.getSales();
    let csv = 'Factura,Fecha,Cliente,FormaPago,Total,Cajero\n';
    sales.forEach(s => {
      csv += `"${s.invoiceNumber}","${s.date}","${s.clientName}","${s.paymentMethod}",${s.total},"${s.user}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Ventas_BicicletasMejia_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    this.showToast('Archivo CSV generado para descarga', 'success');
  },

  // ══════════════════════════════════════════════════════════
  // 9. USUARIOS Y ROLES
  // ══════════════════════════════════════════════════════════
  renderUsers() {
    const users = StoreManager.getUsers();
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div class="font-semibold text-primary">${u.name}</div>
          <div class="text-xs text-muted font-mono">@${u.username}</div>
        </td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-accent' : 'badge-neutral'}">${u.roleLabel}</span></td>
        <td><span class="badge badge-success">${u.status}</span></td>
        <td class="text-xs text-muted">${u.lastLogin}</td>
        <td class="text-right">
          <button class="btn btn-sm btn-secondary" onclick="App.showToast('Configuración de usuario: ${u.name}', 'info')">
            Editar Permisos
          </button>
        </td>
      </tr>
    `).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

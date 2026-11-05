/**
 * Bicicletas Mejía, C.A. — Capa de Datos y Persistencia Local
 * Adaptado para Venezuela: Sistema Bimonetario (USD de Referencia + Bolívares al cambio BCV)
 * Métodos de Pago: Pago Móvil, Punto de Venta (Bs.), Efectivo USD, Efectivo Bs., Zelle
 */

const STORAGE_KEYS = {
  PRODUCTS: 'bm_products_ve_v2',
  CATEGORIES: 'bm_categories_ve_v2',
  CLIENTS: 'bm_clients_ve_v2',
  SUPPLIERS: 'bm_suppliers_ve_v2',
  SALES: 'bm_sales_ve_v2',
  PURCHASES: 'bm_purchases_ve_v2',
  ADJUSTMENTS: 'bm_adjustments_ve_v2',
  USERS: 'bm_users_ve_v2',
  SHIFTS: 'bm_shifts_ve_v2',
  EXCHANGE_RATE: 'bm_exchange_rate_ve',
  SETTINGS: 'bm_settings_ve'
};

const DEFAULT_EXCHANGE_RATE = 894.88; // Tasa oficial Banco Central de Venezuela (Bs. / USD) - Actualizada Maracaibo

const INITIAL_CATEGORIES = [
  { id: 1, name: 'Bicicletas completas', code: 'BIC', count: 4 },
  { id: 2, name: 'Transmisión y cambios', code: 'TRA', count: 5 },
  { id: 3, name: 'Frenos y mandos', code: 'FRE', count: 4 },
  { id: 4, name: 'Cauchos y neumáticos', code: 'CAU', count: 4 },
  { id: 5, name: 'Accesorios y cascos', code: 'ACC', count: 5 }
];

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Bicicleta MTB GW Alligator 29" Frenos Hidráulicos 1x11v',
    barcode: '7701001001',
    sku: 'BIC-GW-29',
    categoryId: 1,
    categoryName: 'Bicicletas completas',
    costPrice: 260.00,
    salePrice: 380.00,
    stock: 6,
    minStock: 2,
    unit: 'UND',
    supplierId: 2,
    active: true
  },
  {
    id: 2,
    name: 'Bicicleta de Ruta Scott Speedster 40 Cuadro Aluminio / Disco',
    barcode: '7701001002',
    sku: 'BIC-SCOTT-40',
    categoryId: 1,
    categoryName: 'Bicicletas completas',
    costPrice: 520.00,
    salePrice: 750.00,
    stock: 3,
    minStock: 1,
    unit: 'UND',
    supplierId: 3,
    active: true
  },
  {
    id: 3,
    name: 'Tensor Shimano Deore M5100 SGS 11 Velocidades Shadow+',
    barcode: '7701002001',
    sku: 'REP-SHI-M5100',
    categoryId: 2,
    categoryName: 'Transmisión y Cambios',
    costPrice: 38.00,
    salePrice: 55.00,
    stock: 14,
    minStock: 4,
    unit: 'UND',
    supplierId: 1,
    active: true
  },
  {
    id: 4,
    name: 'Cadena KMC X11 Silver 118 Eslabones con Quick-Link',
    barcode: '7701002002',
    sku: 'REP-KMC-X11',
    categoryId: 2,
    categoryName: 'Transmisión y Cambios',
    costPrice: 16.00,
    salePrice: 25.00,
    stock: 22,
    minStock: 5,
    unit: 'UND',
    supplierId: 1,
    active: true
  },
  {
    id: 5,
    name: 'Pastillas de Freno Shimano B05S Resina (Deore / Altus / Tektro)',
    barcode: '7701003001',
    sku: 'REP-PAD-B05S',
    categoryId: 3,
    categoryName: 'Frenos y mandos',
    costPrice: 4.50,
    salePrice: 8.00,
    stock: 35,
    minStock: 8,
    unit: 'PAR',
    supplierId: 1,
    active: true
  },
  {
    id: 6,
    name: 'Rotores de Freno Shimano SM-RT56 160mm 6 Tornillos',
    barcode: '7701003002',
    sku: 'REP-ROT-160',
    categoryId: 3,
    categoryName: 'Frenos y mandos',
    costPrice: 11.00,
    salePrice: 18.00,
    stock: 12,
    minStock: 3,
    unit: 'UND',
    supplierId: 1,
    active: true
  },
  {
    id: 7,
    name: 'Caucho Maxxis Ikon 29 x 2.20 Plegable EXO TR Tubeless',
    barcode: '7701004001',
    sku: 'CAU-MAX-29',
    categoryId: 4,
    categoryName: 'Cauchos y Neumáticos',
    costPrice: 26.00,
    salePrice: 42.00,
    stock: 16,
    minStock: 4,
    unit: 'UND',
    supplierId: 4,
    active: true
  },
  {
    id: 8,
    name: 'Neumático Chaoyang 29 x 2.10/2.35 Válvula Presta 48mm',
    barcode: '7701004002',
    sku: 'CAU-CHAO-29',
    categoryId: 4,
    categoryName: 'Cauchos y Neumáticos',
    costPrice: 3.50,
    salePrice: 6.00,
    stock: 40,
    minStock: 10,
    unit: 'UND',
    supplierId: 4,
    active: true
  },
  {
    id: 9,
    name: 'Casco GW Mantis Ciclismo Ajustable con Luz LED Recargable',
    barcode: '7701005001',
    sku: 'ACC-CAS-MAN',
    categoryId: 5,
    categoryName: 'Accesorios y cascos',
    costPrice: 19.00,
    salePrice: 32.00,
    stock: 10,
    minStock: 3,
    unit: 'UND',
    supplierId: 2,
    active: true
  },
  {
    id: 10,
    name: 'Luces Delantera y Trasera LED USB Impermeable 400 Lumens',
    barcode: '7701005002',
    sku: 'ACC-LUC-SET',
    categoryId: 5,
    categoryName: 'Accesorios y cascos',
    costPrice: 8.00,
    salePrice: 15.00,
    stock: 25,
    minStock: 5,
    unit: 'JGO',
    supplierId: 4,
    active: true
  },
  {
    id: 13,
    name: 'Lubricante Seco Finish Line Teflón 120ml para Cadena',
    barcode: '7701005003',
    sku: 'ACC-LUB-DRY',
    categoryId: 5,
    categoryName: 'Accesorios y cascos',
    costPrice: 6.50,
    salePrice: 11.00,
    stock: 18,
    minStock: 4,
    unit: 'UND',
    supplierId: 4,
    active: true
  }
];

const INITIAL_CLIENTS = [
  { id: 1, name: 'Cliente Mostrador / Ocasional', document: 'V-00000000', phone: '0414-0000000', email: 'mostrador@tienda.com', purchasesCount: 94, address: 'Venta Mostrador' },
  { id: 2, name: 'Carlos Eduardo Mendoza', document: 'V-14.892.341', phone: '0414-3829102', email: 'cmendoza@empresa.com.ve', purchasesCount: 7, address: 'Av. 5 de Julio, Maracaibo' },
  { id: 3, name: 'Mariana Gómez Rivas', document: 'V-18.472.901', phone: '0412-8921473', email: 'mariana.gomez@gmail.com', purchasesCount: 12, address: 'Av. Delicias con Dr. Portillo, Maracaibo' },
  { id: 4, name: 'Andrés Vicente Silva', document: 'V-11.239.845', phone: '0424-6123489', email: 'andres.silva@clubciclista.com', purchasesCount: 19, address: 'Urb. La Coromoto, San Francisco, Zulia' },
  { id: 5, name: 'Club Ciclista Lago de Maracaibo, C.A.', document: 'J-40192834-1', phone: '0261-7491022', email: 'contacto@ciclistasdellago.com', purchasesCount: 28, address: 'Vereda del Lago, Maracaibo' }
];

const INITIAL_SUPPLIERS = [
  { id: 1, name: 'Importadora Shimano de Venezuela, S.A.', nit: 'J-31298412-0', contact: 'Alejandro Morales', phone: '0261-7294812', email: 'pedidos@shimanovenezuela.com', leadDays: 2 },
  { id: 2, name: 'Distribuidora Bicipartes del Zulia, C.A.', nit: 'J-30849201-4', contact: 'Diana Carolina Ramos', phone: '0261-7389102', email: 'ventas@biciparteszulia.com.ve', leadDays: 1 },
  { id: 3, name: 'Representaciones Scott & Montaña Occidente, C.A.', nit: 'J-40129845-6', contact: 'Mauricio Quintero', phone: '0261-7892301', email: 'contacto@scottoccidente.com', leadDays: 3 },
  { id: 4, name: 'Ciclo Accesorios Los Haticos, C.A.', nit: 'J-30491823-7', contact: 'Alonso Mejía', phone: '0414-6498812', email: 'pedidos@ciclohaticos.com.ve', leadDays: 2 }
];

const INITIAL_SALES = [
  {
    id: 1045,
    invoiceNumber: 'BM-001045',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    clientName: 'Carlos Eduardo Mendoza',
    itemsCount: 2,
    subtotal: 80.00,
    tax: 0,
    discount: 5.00,
    total: 75.00,
    totalBs: 75.00 * DEFAULT_EXCHANGE_RATE,
    exchangeRate: DEFAULT_EXCHANGE_RATE,
    paymentMethod: 'Pago Móvil (Ref: 8392)',
    caja: 'Caja Principal',
    user: 'admin',
    items: [
      { name: 'Tensor Shimano Deore M5100 SGS 11 Velocidades', qty: 1, price: 55.00, subtotal: 55.00 },
      { name: 'Cadena KMC X11 Silver 118 Eslabones', qty: 1, price: 25.00, subtotal: 25.00 }
    ]
  },
  {
    id: 1046,
    invoiceNumber: 'BM-001046',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    clientName: 'Cliente Mostrador / Ocasional',
    itemsCount: 1,
    subtotal: 32.00,
    tax: 0,
    discount: 0,
    total: 32.00,
    totalBs: 32.00 * DEFAULT_EXCHANGE_RATE,
    exchangeRate: DEFAULT_EXCHANGE_RATE,
    paymentMethod: 'Efectivo USD',
    caja: 'Caja #2 - Ventas',
    user: 'cajero',
    items: [
      { name: 'Casco GW Mantis Ciclismo Ajustable con Luz LED', qty: 1, price: 32.00, subtotal: 32.00 }
    ]
  },
  {
    id: 1047,
    invoiceNumber: 'BM-001047',
    date: new Date(Date.now() - 3600000 * 8).toISOString(),
    clientName: 'Mariana Gómez Rivas',
    itemsCount: 3,
    subtotal: 44.00,
    tax: 0,
    discount: 4.00,
    total: 40.00,
    totalBs: 40.00 * DEFAULT_EXCHANGE_RATE,
    exchangeRate: DEFAULT_EXCHANGE_RATE,
    paymentMethod: 'Punto de Venta / Débito (Bs.)',
    caja: 'Caja Principal',
    user: 'admin',
    items: [
      { name: 'Pastillas de Freno Shimano B05S Resina', qty: 2, price: 8.00, subtotal: 16.00 },
      { name: 'Lubricante Seco Finish Line Teflón 120ml', qty: 1, price: 11.00, subtotal: 11.00 },
      { name: 'Purgado y Calibración de Frenos Hidráulicos', qty: 1, price: 12.00, subtotal: 12.00 }
    ]
  }
];

const INITIAL_PURCHASES = [
  {
    id: 201,
    orderNumber: 'OC-2024-00201',
    supplierName: 'Importadora Shimano de Venezuela, S.A.',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    total: 470.00,
    status: 'Recibido en Bodega',
    itemsSummary: '10x Tensores Deore M5100, 20x Pastillas B05S',
    receivedBy: 'Carlos Rendón (Bodega)'
  },
  {
    id: 202,
    orderNumber: 'OC-2024-00202',
    supplierName: 'Distribuidora Bicipartes Venezuela, C.A.',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    total: 932.00,
    status: 'Recibido en Bodega',
    itemsSummary: '2x Bicicletas GW 29", 8x Cascos Mantis, 15x Neumáticos Chaoyang',
    receivedBy: 'Carlos Rendón (Bodega)'
  }
];

const INITIAL_USERS = [
  { id: 1, username: 'admin', name: 'Sebastián Mejía', role: 'admin', roleLabel: 'Administrador general', status: 'Activo', lastLogin: 'Hoy, 08:30 AM' },
  { id: 2, username: 'cajero', name: 'Camila Morales', role: 'cajero', roleLabel: 'Cajera', status: 'Activo', lastLogin: 'Hoy, 08:00 AM' },
  { id: 3, username: 'bodeguero', name: 'Carlos Rendón', role: 'bodeguero', roleLabel: 'Bodeguero', status: 'Activo', lastLogin: 'Ayer, 05:40 PM' }
];

const INITIAL_SHIFTS = [
  {
    id: 1,
    caja: 'Caja #2 - Ventas',
    username: 'cajero',
    cashierName: 'Camila Morales',
    startTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    baseCash: 50.00, // $50 USD base inicial en caja
    status: 'abierto',
    closedTime: null,
    salesCount: 3,
    cashSales: 32.00, // $32 USD en efectivo
    electronicSales: 115.00, // Pagos en Pago Móvil / Punto Bs. / Zelle
    countedCash: null,
    difference: null
  },
  {
    id: 2,
    caja: 'Caja Principal',
    username: 'admin',
    cashierName: 'Sebastián Mejía',
    startTime: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    baseCash: 100.00,
    status: 'abierto',
    closedTime: null,
    salesCount: 5,
    cashSales: 120.00,
    electronicSales: 340.00,
    countedCash: null,
    difference: null
  }
];

const INITIAL_ADJUSTMENTS = [
  {
    id: 1,
    date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    productId: 5,
    productName: 'Tripa / Tubo Kenda 29 x 2.10/2.35 V/F',
    type: 'salida',
    qty: 2,
    reason: 'Merma por empaque averiado en exhibición',
    user: 'Carlos Rendón'
  },
  {
    id: 2,
    date: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    productId: 4,
    productName: 'Pastillas de Freno Shimano B05S Resina',
    type: 'salida',
    qty: 1,
    reason: 'Reposición por garantía de fábrica',
    user: 'Carlos Rendón'
  },
  {
    id: 3,
    date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    productId: 7,
    productName: 'Lubricante Seco Finish Line Teflón 120ml',
    type: 'salida',
    qty: 1,
    reason: 'Derrame accidental en bodega de almacenamiento',
    user: 'Carlos Rendón'
  }
];

class StoreManager {
  static get(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error en almacenamiento local', e);
    }
  }

  // Tasa de cambio oficial BCV (Bs. por cada USD)
  static getExchangeRate() {
    const rate = this.get(STORAGE_KEYS.EXCHANGE_RATE, DEFAULT_EXCHANGE_RATE);
    return parseFloat(rate) || DEFAULT_EXCHANGE_RATE;
  }

  static setExchangeRate(rate) {
    const val = parseFloat(rate);
    if (!isNaN(val) && val > 0) {
      this.set(STORAGE_KEYS.EXCHANGE_RATE, val);
      return val;
    }
    return DEFAULT_EXCHANGE_RATE;
  }

  static init(forceReset = false) {
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.set(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.set(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      this.set(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
      this.set(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SALES)) {
      this.set(STORAGE_KEYS.SALES, INITIAL_SALES);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
      this.set(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
      this.set(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS)) {
      this.set(STORAGE_KEYS.ADJUSTMENTS, INITIAL_ADJUSTMENTS);
    }
    const storedRate = parseFloat(localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATE));
    if (forceReset || !storedRate || storedRate === 45 || storedRate < 100) {
      this.set(STORAGE_KEYS.EXCHANGE_RATE, DEFAULT_EXCHANGE_RATE);
    }
  }

  static getProducts() {
    const list = this.get(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const filtered = list.filter(p => p.unit !== 'SRV' && p.categoryId !== 6);
    if (filtered.length !== list.length) this.saveProducts(filtered);
    return filtered;
  }
  static saveProducts(products) { this.set(STORAGE_KEYS.PRODUCTS, products); }

  static getCategories() {
    const list = this.get(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const filtered = list.filter(c => c.code !== 'SRV' && c.id !== 6);
    if (filtered.length !== list.length) this.saveCategories(filtered);
    return filtered;
  }
  static saveCategories(categories) { this.set(STORAGE_KEYS.CATEGORIES, categories); }

  static getClients() { return this.get(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS); }
  static saveClients(clients) { this.set(STORAGE_KEYS.CLIENTS, clients); }

  static getSuppliers() { return this.get(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS); }
  static saveSuppliers(suppliers) { this.set(STORAGE_KEYS.SUPPLIERS, suppliers); }

  static getSales() { return this.get(STORAGE_KEYS.SALES, INITIAL_SALES); }
  static saveSales(sales) { this.set(STORAGE_KEYS.SALES, sales); }

  static getPurchases() { return this.get(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES); }
  static savePurchases(purchases) { this.set(STORAGE_KEYS.PURCHASES, purchases); }

  static getAdjustments() { return this.get(STORAGE_KEYS.ADJUSTMENTS, INITIAL_ADJUSTMENTS); }
  static saveAdjustments(adjustments) { this.set(STORAGE_KEYS.ADJUSTMENTS, adjustments); }
  static recordAdjustment(adj) {
    const list = this.getAdjustments();
    list.unshift(adj);
    this.saveAdjustments(list);
    return adj;
  }

  static getUsers() {
    let users = this.get(STORAGE_KEYS.USERS, INITIAL_USERS);
    let updated = false;
    users = users.map(u => {
      if (u.username === 'bodega') {
        u.username = 'bodeguero';
        u.roleLabel = 'Bodeguero';
        updated = true;
      }
      return u;
    });
    if (updated) this.saveUsers(users);
    return users;
  }
  static saveUsers(users) { this.set(STORAGE_KEYS.USERS, users); }

  static getShifts() { return this.get(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS); }
  static saveShifts(shifts) { this.set(STORAGE_KEYS.SHIFTS, shifts); }

  static getActiveShift(caja) {
    const shifts = this.getShifts();
    return shifts.find(s => s.caja === caja && s.status === 'abierto') || null;
  }

  static openShift(newShift) {
    const shifts = this.getShifts();
    shifts.unshift(newShift);
    this.saveShifts(shifts);
    return newShift;
  }

  static recordSale(saleData) {
    const sales = this.getSales();
    sales.unshift(saleData);
    this.saveSales(sales);

    // Descontar inventario para artículos físicos
    const products = this.getProducts();
    saleData.items.forEach(saleItem => {
      const p = products.find(prod => prod.id === saleItem.id);
      if (p && p.unit !== 'SRV') {
        p.stock = Math.max(0, p.stock - saleItem.qty);
      }
    });
    this.saveProducts(products);

    // Actualizar ventas en el turno activo si el pago fue en efectivo
    if (saleData.caja) {
      const shifts = this.getShifts();
      const shiftIndex = shifts.findIndex(s => s.caja === saleData.caja && s.status === 'abierto');
      if (shiftIndex > -1) {
        shifts[shiftIndex].salesCount = (shifts[shiftIndex].salesCount || 0) + 1;
        if (saleData.paymentMethod.includes('Efectivo')) {
          shifts[shiftIndex].cashSales = (shifts[shiftIndex].cashSales || 0) + (saleData.total || 0);
        } else {
          shifts[shiftIndex].electronicSales = (shifts[shiftIndex].electronicSales || 0) + (saleData.total || 0);
        }
        this.saveShifts(shifts);
      }
    }

    return saleData;
  }

  static closeShift(shiftId, countedCash, notes = '') {
    const shifts = this.getShifts();
    const idx = shifts.findIndex(s => s.id === shiftId);
    if (idx === -1) return null;
    const shift = shifts[idx];
    const expected = (shift.baseCash || 0) + (shift.cashSales || 0);
    const counted = parseFloat(countedCash) || 0;
    shift.status = 'cerrado';
    shift.closedTime = new Date().toISOString();
    shift.countedCash = counted;
    shift.difference = counted - expected;
    shift.notes = notes;
    this.saveShifts(shifts);
    return shift;
  }
}

// ── Funciones de Formato Monetario Bimonetario ─────────────
function formatUSD(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatVES(amountUSD) {
  const num = typeof amountUSD === 'number' ? amountUSD : parseFloat(amountUSD) || 0;
  const rate = StoreManager.getExchangeRate();
  const bs = num * rate;
  return 'Bs. ' + bs.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatMoney(amount) {
  return formatUSD(amount);
}

function formatDual(amountUSD) {
  return `${formatUSD(amountUSD)} <span class="text-xs text-muted font-mono" style="font-weight: normal; opacity: 0.85;">(${formatVES(amountUSD)})</span>`;
}

// Inicializar almacenamiento local
StoreManager.init();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    StoreManager,
    formatMoney,
    formatUSD,
    formatVES,
    formatDual,
    DEFAULT_EXCHANGE_RATE,
    STORAGE_KEYS,
    INITIAL_PRODUCTS,
    INITIAL_CATEGORIES,
    INITIAL_CLIENTS,
    INITIAL_SUPPLIERS,
    INITIAL_SALES,
    INITIAL_PURCHASES,
    INITIAL_USERS,
    INITIAL_SHIFTS
  };
}

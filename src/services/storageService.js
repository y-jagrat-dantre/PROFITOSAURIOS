// ─── Storage Service ────────────────────────────────────────────────────────
const KEYS = {
  VEGETABLES: 'vv_vegetables',
  SALES: 'vv_sales',
  WASTAGE: 'vv_wastage',
  SETTINGS: 'vv_settings',
  FORECAST: 'vv_forecast',
};

function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    
    // For this demo, if the saved data is an empty array but we provided a non-empty fallback (dummy data), use the dummy data.
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      return fallback;
    }
    
    return parsed;
  } catch {
    return fallback;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  localStorage.removeItem(key);
}

const defaultVegetables = [
  { id: 'v1', name: 'Tomato', purchasePrice: 20, sellingPrice: 35, availableQuantity: 50, expectedDemand: 60, wastageRate: 5, category: 'Vegetables' },
  { id: 'v2', name: 'Onion', purchasePrice: 25, sellingPrice: 40, availableQuantity: 100, expectedDemand: 80, wastageRate: 2, category: 'Vegetables' },
  { id: 'v3', name: 'Potato', purchasePrice: 15, sellingPrice: 25, availableQuantity: 150, expectedDemand: 100, wastageRate: 3, category: 'Vegetables' },
  { id: 'v4', name: 'Carrot', purchasePrice: 30, sellingPrice: 50, availableQuantity: 30, expectedDemand: 45, wastageRate: 8, category: 'Vegetables' },
  { id: 'v5', name: 'Apple', purchasePrice: 80, sellingPrice: 120, availableQuantity: 40, expectedDemand: 50, wastageRate: 4, category: 'Fruits' },
  { id: 'v6', name: 'Banana', purchasePrice: 35, sellingPrice: 60, availableQuantity: 80, expectedDemand: 90, wastageRate: 15, category: 'Fruits' }
];

const defaultSales = [
  { id: 's1', vegetableName: 'Tomato', quantity: 15, price: 35, date: new Date().toISOString() },
  { id: 's2', vegetableName: 'Onion', quantity: 20, price: 40, date: new Date().toISOString() },
  { id: 's3', vegetableName: 'Potato', quantity: 30, price: 25, date: new Date().toISOString() },
  { id: 's4', vegetableName: 'Apple', quantity: 10, price: 120, date: new Date().toISOString() },
];

export const storageService = {
  // Vegetables
  getVegetables: () => get(KEYS.VEGETABLES, defaultVegetables),
  saveVegetables: (vegs) => set(KEYS.VEGETABLES, vegs),

  // Sales
  getSales: () => get(KEYS.SALES, defaultSales),
  saveSales: (sales) => set(KEYS.SALES, sales),

  // Wastage records
  getWastage: () => get(KEYS.WASTAGE, []),
  saveWastage: (w) => set(KEYS.WASTAGE, w),

  // Settings
  getSettings: () => get(KEYS.SETTINGS, {
    budget: 10000,
    storageCapacity: 500,
    optimizationMode: 'balanced',
    language: 'en',
    geminiKey: '',
  }),
  saveSettings: (s) => set(KEYS.SETTINGS, s),

  // Clear all
  clearAll: () => {
    Object.values(KEYS).forEach(remove);
  },
};

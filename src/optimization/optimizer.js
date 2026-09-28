// ─── Mathematical Optimization Engine ───────────────────────────────────────
// Generalized greedy LP-style optimizer supporting N vegetables
// Respects budget, storage, demand, min/max stock, and wastage constraints.

/**
 * Calculate profit per kg adjusted for wastage.
 */
export function profitPerKg(veg) {
  const rawProfit = veg.sellingPrice - veg.purchasePrice;
  const effectiveSellable = 1 - veg.wastageRate / 100;
  return rawProfit * effectiveSellable;
}

/**
 * Calculate revenue for a given quantity.
 */
export function calcRevenue(qty, veg) {
  const effectiveQty = qty * (1 - veg.wastageRate / 100);
  return effectiveQty * veg.sellingPrice;
}

/**
 * Calculate profit for a given quantity.
 */
export function calcProfit(qty, veg) {
  const effectiveQty = qty * (1 - veg.wastageRate / 100);
  return effectiveQty * veg.sellingPrice - qty * veg.purchasePrice;
}

/**
 * Calculate expected wastage cost for a given quantity.
 */
export function calcWastage(qty, veg) {
  return qty * (veg.wastageRate / 100) * veg.purchasePrice;
}

/**
 * Demand safety factor: don't stock far above demand unless in maxSales mode.
 */
function demandCap(veg, mode) {
  const factor = mode === 'maxSales' ? 1.2 : mode === 'maxProfit' ? 0.95 : 1.0;
  return Math.min(veg.expectedDemand * factor, veg.maximumStock);
}

/**
 * Score a vegetable for prioritization depending on the optimization mode.
 */
function vegScore(veg, mode) {
  const profit = profitPerKg(veg);
  const revenue = veg.sellingPrice * (1 - veg.wastageRate / 100);
  const demand = veg.expectedDemand;

  if (mode === 'maxProfit') return profit;
  if (mode === 'maxSales') return revenue;
  // balanced: combine profit margin ratio and demand
  return profit * 0.6 + (demand / 100) * 0.4;
}

/**
 * Main optimization function.
 * Returns an array of { vegetable, recommendedQty, expectedSales, expectedRevenue, expectedProfit, expectedWastage, profitMargin, demandLevel } for each vegetable.
 */
export function optimize(vegetables, budget, storageCapacity, mode = 'balanced') {
  if (!vegetables || vegetables.length === 0) return [];

  // Sort by score descending (greedy allocation)
  const sorted = [...vegetables].map(veg => ({
    veg,
    score: vegScore(veg, mode),
    cap: demandCap(veg, mode),
  })).sort((a, b) => b.score - a.score);

  let remainingBudget = budget;
  let remainingStorage = storageCapacity;
  const results = [];

  // First pass: allocate minimum stock
  for (const { veg } of sorted) {
    const minQty = Math.min(veg.minimumStock || 0, veg.expectedDemand);
    const cost = minQty * veg.purchasePrice;
    if (cost <= remainingBudget && minQty <= remainingStorage) {
      remainingBudget -= cost;
      remainingStorage -= minQty;
      results.push({ vegId: veg.id, qty: minQty });
    } else {
      results.push({ vegId: veg.id, qty: 0 });
    }
  }

  // Second pass: allocate remaining budget greedily
  let changed = true;
  const MAX_ITER = 200;
  let iter = 0;
  while (changed && remainingBudget > 0 && remainingStorage > 0 && iter < MAX_ITER) {
    changed = false;
    iter++;
    for (let i = 0; i < sorted.length; i++) {
      const { veg, cap } = sorted[i];
      const current = results[i].qty;
      const increment = Math.min(1, cap - current);
      if (increment <= 0) continue;
      if (veg.purchasePrice > remainingBudget) continue;
      if (1 > remainingStorage) continue;
      const toAdd = Math.min(
        increment,
        Math.floor(remainingBudget / veg.purchasePrice),
        Math.floor(remainingStorage)
      );
      if (toAdd <= 0) continue;
      const actualAdd = Math.min(toAdd, cap - current);
      if (actualAdd <= 0) continue;
      results[i].qty += actualAdd;
      remainingBudget -= actualAdd * veg.purchasePrice;
      remainingStorage -= actualAdd;
      changed = true;
    }
  }

  // Build output
  return sorted.map(({ veg }, i) => {
    const qty = results[i].qty;
    const effectiveQty = qty * (1 - veg.wastageRate / 100);
    const expSales = Math.min(effectiveQty, veg.expectedDemand);
    const revenue = expSales * veg.sellingPrice;
    const profit = expSales * veg.sellingPrice - qty * veg.purchasePrice;
    const wastage = calcWastage(qty, veg);
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const demandRatio = veg.expectedDemand > 0 ? qty / veg.expectedDemand : 0;
    const demandLevel = demandRatio >= 0.9 ? 'High' : demandRatio >= 0.6 ? 'Medium' : 'Low';
    const wastageRisk = veg.wastageRate >= 15 ? 'High' : veg.wastageRate >= 8 ? 'Medium' : 'Low';

    return {
      vegetable: veg,
      recommendedQty: qty,
      expectedSales: Math.round(expSales * 10) / 10,
      expectedRevenue: Math.round(revenue),
      expectedProfit: Math.round(profit),
      expectedWastage: Math.round(wastage),
      profitMargin: Math.round(profitMargin),
      demandLevel,
      wastageRisk,
      budgetUsed: qty * veg.purchasePrice,
    };
  });
}

/**
 * Calculate dashboard summary from optimization results.
 */
export function calcSummary(results, vegetables) {
  const totalStock = vegetables.reduce((s, v) => s + v.availableQuantity, 0);
  const totalCapacity = vegetables.reduce((s, v) => s + v.storageCapacity, 0);
  const stockUtilization = totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;

  const totalExpectedRevenue = results.reduce((s, r) => s + r.expectedRevenue, 0);
  const totalExpectedProfit = results.reduce((s, r) => s + r.expectedProfit, 0);
  const totalExpectedWastage = results.reduce((s, r) => s + r.expectedWastage, 0);
  const totalExpectedSalesKg = results.reduce((s, r) => s + r.expectedSales, 0);

  const highDemand = results
    .filter(r => r.demandLevel === 'High')
    .map(r => r.vegetable.name);

  return {
    totalVegetables: vegetables.length,
    totalStock,
    stockUtilization,
    totalExpectedRevenue,
    totalExpectedProfit,
    totalExpectedWastage,
    totalExpectedSalesKg,
    highDemand,
  };
}

/**
 * Generate intelligent alerts.
 */
export function generateAlerts(results) {
  const alerts = [];
  for (const r of results) {
    const { vegetable: veg, recommendedQty, expectedSales, wastageRisk } = r;
    // Overstock
    if (veg.availableQuantity > veg.expectedDemand * 1.3) {
      alerts.push({
        type: 'warning',
        title: 'Overstock Risk',
        message: `You may have more ${veg.name} (${veg.availableQuantity} kg) than expected demand (${veg.expectedDemand} kg). Consider reducing stock.`,
        vegetable: veg.name,
      });
    }
    // Low stock
    if (veg.availableQuantity < veg.minimumStock) {
      alerts.push({
        type: 'danger',
        title: 'Low Stock Alert',
        message: `${veg.name} stock (${veg.availableQuantity} kg) is below minimum (${veg.minimumStock} kg). Consider restocking.`,
        vegetable: veg.name,
      });
    }
    // Good opportunity
    const profit = profitPerKg(veg);
    if (profit > 15 && wastageRisk === 'Low') {
      alerts.push({
        type: 'success',
        title: 'Good Opportunity',
        message: `${veg.name} has a strong estimated margin of ₹${Math.round(profit)}/kg with relatively low wastage risk.`,
        vegetable: veg.name,
      });
    }
    // High wastage risk
    if (wastageRisk === 'High') {
      alerts.push({
        type: 'warning',
        title: 'High Wastage Risk',
        message: `${veg.name} has a high wastage rate (${veg.wastageRate}%). Reduce stock by approx. ${Math.round(recommendedQty * veg.wastageRate / 100)} kg to manage losses.`,
        vegetable: veg.name,
      });
    }
  }
  return alerts.slice(0, 6); // limit to 6 alerts
}

/**
 * Calculate prediction confidence based on available data.
 */
export function calcConfidence(vegetables, sales) {
  let score = 0;
  const factors = [];

  if (vegetables.length > 0) { score += 20; factors.push('Vegetable data available'); }
  if (sales.length >= 30) { score += 30; factors.push('30+ days of sales data'); }
  else if (sales.length >= 14) { score += 20; factors.push('14+ days of sales data'); }
  else if (sales.length >= 7) { score += 10; factors.push('7+ days of sales data'); }

  const hasPrice = vegetables.every(v => v.sellingPrice > 0 && v.purchasePrice > 0);
  if (hasPrice) { score += 15; factors.push('Current selling prices'); }

  const hasDemand = vegetables.every(v => v.expectedDemand > 0);
  if (hasDemand) { score += 15; factors.push('Expected demand entered'); }

  const hasWastage = vegetables.some(v => v.wastageRate > 0);
  if (hasWastage) { score += 10; factors.push('Wastage rates configured'); }

  if (sales.length > 0) { score += 10; factors.push('Historical demand data'); }

  return { score: Math.min(score, 98), factors };
}

/**
 * Calculate advanced model display string.
 */
export function buildModelString(vegetables, budget, storageCapacity, mode) {
  const variables = vegetables.map((v, i) => `x${i + 1} = ${v.name}`).join('\n');
  const objective = vegetables.map((v, i) => {
    const p = Math.round(profitPerKg(v));
    return `${p}x${i + 1}`;
  }).join(' + ');
  const budgetConstraint = vegetables.map((v, i) => `${v.purchasePrice}x${i + 1}`).join(' + ') + ` ≤ ₹${budget.toLocaleString('en-IN')}`;
  const storageConstraint = vegetables.map((_, i) => `x${i + 1}`).join(' + ') + ` ≤ ${storageCapacity} kg`;
  const demandConstraints = vegetables.map((v, i) => `x${i + 1} ≤ ${v.expectedDemand} kg  (${v.name} demand)`).join('\n');

  return { variables, objective, budgetConstraint, storageConstraint, demandConstraints };
}

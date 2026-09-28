// ─── Currency / Number Utilities ─────────────────────────────────────────────

/**
 * Format number in Indian number system (₹1,23,456).
 */
export function formatINR(value) {
  if (value == null || isNaN(value)) return '₹0';
  return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/**
 * Format kg value.
 */
export function formatKg(value) {
  if (value == null || isNaN(value)) return '0 kg';
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' kg';
}

/**
 * Format percentage.
 */
export function formatPct(value) {
  return (value ?? 0).toFixed(1) + '%';
}

/**
 * Generate a unique ID.
 */
export function genId() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

/**
 * Parse CSV into array of objects.
 */
export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

/**
 * Convert array of objects to CSV string.
 */
export function toCSV(data) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h] ?? '').join(','));
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download string as file.
 */
export function downloadFile(content, filename, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Calculate trend from array of numbers.
 */
export function calcTrend(values) {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = values.reduce((s, _, i) => s + i, 0);
  const sumY = values.reduce((s, v) => s + v, 0);
  const sumXY = values.reduce((s, v, i) => s + i * v, 0);
  const sumX2 = values.reduce((s, _, i) => s + i * i, 0);
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
}

/**
 * Get date string N days ago.
 */
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/**
 * Get color for demand level.
 */
export function demandColor(level) {
  return level === 'High' ? '#16a34a' : level === 'Medium' ? '#f59e0b' : '#94a3b8';
}

/**
 * Get badge class for wastage risk.
 */
export function wastageRiskBadge(risk) {
  return risk === 'High' ? 'badge-red' : risk === 'Medium' ? 'badge-yellow' : 'badge-green';
}

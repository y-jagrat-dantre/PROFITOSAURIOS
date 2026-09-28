import { useState } from 'react';
import { useApp } from '../hooks/useAppContext';
import { formatINR, formatKg, downloadFile, toCSV } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { Download } from 'lucide-react';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last 7 Days' },
  { key: 'month', label: 'Last 30 Days' },
];

export default function Reports() {
  const { vegetables, sales, t } = useApp();
  const [period, setPeriod] = useState('month');

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

  const filtered = sales.filter(s => {
    const d = new Date(s.date);
    if (period === 'today') return s.date === today;
    if (period === 'week') return d >= weekAgo;
    return d >= monthAgo;
  });

  const totalRevenue = filtered.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalProfit = filtered.reduce((s, r) => s + (r.profit || 0), 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0;

  // By vegetable
  const byVeg = {};
  filtered.forEach(s => {
    if (!byVeg[s.vegetableName]) byVeg[s.vegetableName] = { qty: 0, revenue: 0, profit: 0 };
    byVeg[s.vegetableName].qty += s.quantity;
    byVeg[s.vegetableName].revenue += s.revenue || 0;
    byVeg[s.vegetableName].profit += s.profit || 0;
  });

  const vegData = Object.entries(byVeg)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue);

  const topByRevenue = vegData[0]?.name;
  const topByProfit = [...vegData].sort((a, b) => b.profit - a.profit)[0]?.name;

  // Daily trend (last 14 days)
  const trendData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const day = filtered.filter(s => s.date === dateStr);
    trendData.push({
      date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue: day.reduce((s, r) => s + (r.revenue || 0), 0),
      profit: day.reduce((s, r) => s + (r.profit || 0), 0),
    });
  }

  function handleExport() {
    const data = filtered.map(s => ({
      Date: s.date,
      Vegetable: s.vegetableName,
      'Qty (kg)': s.quantity,
      'Sell Price': s.sellingPrice,
      Revenue: s.revenue,
      Profit: s.profit,
    }));
    downloadFile(toCSV(data), `report-${period}-${today}.csv`);
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.reports}</h1>
          <span className="page-subtitle">{t.salesPerformanceSummary || 'Sales performance summary'}</span>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={13} /> {t.exportCSV}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Period selector */}
        <div className="toggle-group mb-6" style={{ width: 'fit-content' }}>
          {PERIODS.map(p => (
            <button key={p.key} className={`toggle-btn ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="stats-grid mb-6">
          {[
            { label: t.totalRevenue, value: formatINR(totalRevenue), color: '#16a34a' },
            { label: t.totalProfit, value: formatINR(totalProfit), color: '#3b82f6' },
            { label: t.avgMargin, value: `${avgMargin}%`, color: '#f59e0b' },
            { label: 'Sales Records', value: filtered.length, color: '#8b5cf6' },
            { label: t.topSelling, value: topByRevenue || '—', color: '#16a34a' },
            { label: 'Top by Profit', value: topByProfit || '—', color: '#3b82f6' },
          ].map(({ label, value, color }) => (
            <div className="stat-card" key={label}>
              <div className="stat-card-label">{label}</div>
              <div className="stat-card-value" style={{ color, fontSize: 18 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="charts-grid">
          {trendData.some(d => d.revenue > 0) && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t.revenueTrend || 'Revenue Trend'}</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={v => formatINR(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} dot={false} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {vegData.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t.revenueByVegetable || 'Revenue by Vegetable'}</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={vegData.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                    <Tooltip formatter={v => formatINR(v)} />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} name="Revenue" />
                    <Bar dataKey="profit" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Table by vegetable */}
        {vegData.length > 0 && (
          <div className="table-wrap mt-6">
            <table>
              <thead>
                <tr>
                  <th>{t.vegetable || 'Vegetable'}</th>
                  <th>{t.qtySold || 'Qty Sold'}</th>
                  <th>{t.revenue || 'Revenue'}</th>
                  <th>{t.profit || 'Profit'}</th>
                  <th>{t.margin || 'Margin'}</th>
                </tr>
              </thead>
              <tbody>
                {vegData.map(({ name, qty, revenue, profit }) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td>{qty.toFixed(1)} kg</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatINR(revenue)}</td>
                    <td style={{ color: '#3b82f6', fontWeight: 600 }}>{formatINR(profit)}</td>
                    <td>{revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="card mt-4">
            <div className="card-body" style={{ textAlign: 'center', padding: 40 }}>
              <p className="text-muted">{t.noSalesDataForThisPeriodAddSalesRecordsToSeeReports || 'No sales data for this period. Add sales records to see reports.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

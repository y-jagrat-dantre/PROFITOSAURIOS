import { useState } from 'react';
import { TrendingUp, Package, DollarSign, AlertTriangle, Zap, BarChart2 } from 'lucide-react';
import { useApp } from '../hooks/useAppContext';
import { optimize, calcSummary, generateAlerts, calcConfidence } from '../optimization/optimizer';
import { analyzeWithAI } from '../services/aiService';
import { formatINR, formatKg, formatPct } from '../utils/helpers';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const LOADING_STEPS = [
  'Analyzing inventory...',
  'Checking demand...',
  'Optimizing stock...',
  "Preparing today's plan...",
];

export default function Dashboard({ onNavigate }) {
  const {
    vegetables, sales, settings,
    setOptimizationResults, setAiAnalysis,
    isLoading, setIsLoading, loadingStep, setLoadingStep,
    t,
  } = useApp();

  const [generated, setGenerated] = useState(false);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [confidence, setConfidence] = useState(null);

  // Last 7 days sales chart data
  const salesChartData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.date === dateStr);
      days.push({
        date: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: daySales.reduce((sum, s) => sum + (s.revenue || 0), 0),
        profit: daySales.reduce((sum, s) => sum + (s.profit || 0), 0),
      });
    }
    return days;
  })();

  // Top vegetables by revenue from sales
  const topVegsData = (() => {
    const byVeg = {};
    sales.forEach(s => {
      byVeg[s.vegetableName] = (byVeg[s.vegetableName] || 0) + (s.revenue || 0);
    });
    return Object.entries(byVeg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));
  })();

  async function handleGenerate() {
    if (vegetables.length === 0) {
      alert('Please add vegetables first!');
      onNavigate('vegetables');
      return;
    }
    setIsLoading(true);
    setGenerated(false);

    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadingStep(LOADING_STEPS[i]);
      await new Promise(r => setTimeout(r, 700));
    }

    const results = optimize(vegetables, settings.budget, settings.storageCapacity, settings.optimizationMode);
    setOptimizationResults(results);

    const sum = calcSummary(results, vegetables);
    setSummary(sum);

    const al = generateAlerts(results);
    setAlerts(al);

    const conf = calcConfidence(vegetables, sales);
    setConfidence(conf);

    const ai = await analyzeWithAI(vegetables, sales, settings.budget, settings.storageCapacity, results);
    setAiAnalysis(ai);

    setIsLoading(false);
    setGenerated(true);
  }

  const quickStats = summary ? [
    { label: t.expectedRevenue, value: formatINR(summary.totalExpectedRevenue), icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4' },
    { label: t.expectedProfit, value: formatINR(summary.totalExpectedProfit), icon: DollarSign, color: '#3b82f6', bg: '#eff6ff' },
    { label: t.expectedWastage, value: formatINR(summary.totalExpectedWastage), icon: AlertTriangle, color: '#f59e0b', bg: '#fffbeb' },
    { label: t.stockUtilization, value: formatPct(summary.stockUtilization), icon: Package, color: '#8b5cf6', bg: '#f5f3ff' },
  ] : [
    { label: t.vegetables || 'Vegetables', value: vegetables.length, icon: Package, color: '#16a34a', bg: '#f0fdf4' },
    { label: t.sales || 'Sales Records', value: sales.length, icon: TrendingUp, color: '#3b82f6', bg: '#eff6ff' },
    { label: t.budget || 'Budget', value: formatINR(settings.budget), icon: DollarSign, color: '#f59e0b', bg: '#fffbeb' },
    { label: t.storageCapacity || 'Storage', value: formatKg(settings.storageCapacity), icon: BarChart2, color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  return (
    <div>
      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <div className="loading-text">{loadingStep}</div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.dashboard}</h1>
          <span className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="page-body">
        {/* Generate Button */}
        <button className="generate-btn mb-6" onClick={handleGenerate} disabled={isLoading}>
          <Zap size={22} />
          {t.generatePlan}
        </button>

        {/* Stats */}
        <div className="stats-grid">
          {quickStats.map(({ label, value, icon: Icon, color, bg }) => (
            <div className="stat-card" key={label}>
              <div className="stat-card-icon" style={{ background: bg }}>
                <Icon size={18} color={color} />
              </div>
              <div className="stat-card-label">{label}</div>
              <div className="stat-card-value">{value}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <div className="section-title">{t.smartAlerts || 'Smart Alerts'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((a, i) => (
                <div key={i} className={`alert alert-${a.type === 'danger' ? 'danger' : a.type === 'success' ? 'success' : 'warning'}`}>
                  <div>
                    <strong>{a.title}</strong> — {a.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High demand */}
        {summary && summary.highDemand.length > 0 && (
          <div className="card mb-6">
            <div className="card-header">
              <span className="card-title">🔥 {t.highDemand}</span>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {summary.highDemand.map(name => (
                <span key={name} className="badge badge-green" style={{ fontSize: 13, padding: '6px 14px' }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Confidence */}
        {confidence && (
          <div className="card mb-6">
            <div className="card-header">
              <span className="card-title">{t.confidence}</span>
              <span className="badge badge-green">{confidence.score}%</span>
            </div>
            <div className="card-body">
              <div className="confidence-bar mb-4">
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${confidence.score}%` }} />
                </div>
                <span className="confidence-number">{confidence.score}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {confidence.factors.map(f => (
                  <div key={f} className="text-sm" style={{ color: '#166534' }}>✓ {f}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="charts-grid">
          {salesChartData.some(d => d.revenue > 0) && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{t.revenueAndProfitChart || 'Revenue & Profit (Last 7 Days)'}</span>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={v => formatINR(v)} />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} dot={false} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {topVegsData.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{t.topVegetablesChart || 'Top Vegetables by Revenue'}</span>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topVegsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={v => formatINR(v)} />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Quick navigation cards */}
        {!generated && vegetables.length === 0 && (
          <div className="card mt-6">
            <div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                <img src="/logo.png" alt="PROFITOSAURIOS Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{t.welcomeMsg || 'Welcome to PROFITOSAURIOS!'}</div>
              <div className="text-muted mb-4">{t.welcomeDesc || 'Start by adding your vegetables or loading demo data to see the full experience.'}</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => onNavigate('vegetables')}>{t.addVegetable || 'Add Vegetables'}</button>
                <button className="btn btn-secondary" onClick={() => onNavigate('settings')}>{t.loadDemo || 'Load Demo Data'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

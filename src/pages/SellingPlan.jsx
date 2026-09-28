import { useState, useMemo } from 'react';
import { ShoppingCart, TrendingUp, TrendingDown, Minus, Check, AlertTriangle, ArrowRight, Package, DollarSign } from 'lucide-react';
import { useApp } from '../hooks/useAppContext';
import { formatINR } from '../utils/helpers';

/* ─── Selling Plan Data ──────────────────────────────────────────────────── */

const PLAN_DATA = [
  // High Recommendation
  { name: 'Tomato', emoji: '🍅', type: 'Vegetable', buyPrice: 18, sellPrice: 35, buyQty: 20, unit: 'kg', demand: 'High', shelfLife: 3, recommendation: 'Must Buy', reason: 'Daily essential — sells fast everywhere' },
  { name: 'Onion', emoji: '🧅', type: 'Vegetable', buyPrice: 22, sellPrice: 40, buyQty: 15, unit: 'kg', demand: 'High', shelfLife: 15, recommendation: 'Must Buy', reason: 'Long shelf life, always in demand' },
  { name: 'Potato', emoji: '🥔', type: 'Vegetable', buyPrice: 12, sellPrice: 25, buyQty: 25, unit: 'kg', demand: 'High', shelfLife: 20, recommendation: 'Must Buy', reason: 'Very cheap to buy, lasts long' },
  { name: 'Green Chili', emoji: '🌶️', type: 'Vegetable', buyPrice: 30, sellPrice: 60, buyQty: 5, unit: 'kg', demand: 'High', shelfLife: 4, recommendation: 'Must Buy', reason: 'High margin, every kitchen needs it' },
  { name: 'Coriander', emoji: '🌿', type: 'Vegetable', buyPrice: 5, sellPrice: 15, buyQty: 20, unit: 'bunch', demand: 'High', shelfLife: 2, recommendation: 'Must Buy', reason: 'Sells with every purchase — very cheap' },
  { name: 'Banana', emoji: '🍌', type: 'Fruit', buyPrice: 25, sellPrice: 50, buyQty: 10, unit: 'dozen', demand: 'High', shelfLife: 4, recommendation: 'Must Buy', reason: 'Popular fruit, good profit margin' },
  { name: 'Lemon', emoji: '🍋', type: 'Fruit', buyPrice: 40, sellPrice: 80, buyQty: 5, unit: 'kg', demand: 'High', shelfLife: 7, recommendation: 'Must Buy', reason: 'High margin, used in cooking and drinks' },

  // Medium Recommendation
  { name: 'Capsicum', emoji: '🫑', type: 'Vegetable', buyPrice: 35, sellPrice: 65, buyQty: 5, unit: 'kg', demand: 'Medium', shelfLife: 5, recommendation: 'Good to Buy', reason: 'Good margin, popular in cities' },
  { name: 'Carrot', emoji: '🥕', type: 'Vegetable', buyPrice: 25, sellPrice: 45, buyQty: 10, unit: 'kg', demand: 'Medium', shelfLife: 7, recommendation: 'Good to Buy', reason: 'Healthy choice, lasts well' },
  { name: 'Cauliflower', emoji: '🥦', type: 'Vegetable', buyPrice: 20, sellPrice: 40, buyQty: 10, unit: 'piece', demand: 'Medium', shelfLife: 4, recommendation: 'Good to Buy', reason: 'Winter favorite, decent shelf life' },
  { name: 'Lady Finger', emoji: '🫛', type: 'Vegetable', buyPrice: 32, sellPrice: 55, buyQty: 8, unit: 'kg', demand: 'Medium', shelfLife: 3, recommendation: 'Good to Buy', reason: 'Popular in summer, cook\'s favorite' },
  { name: 'Apple', emoji: '🍎', type: 'Fruit', buyPrice: 80, sellPrice: 150, buyQty: 5, unit: 'kg', demand: 'Medium', shelfLife: 10, recommendation: 'Good to Buy', reason: 'Premium fruit, long shelf life' },
  { name: 'Orange', emoji: '🍊', type: 'Fruit', buyPrice: 35, sellPrice: 60, buyQty: 8, unit: 'kg', demand: 'Medium', shelfLife: 8, recommendation: 'Good to Buy', reason: 'Lasts well, good winter seller' },

  // Low/Optional
  { name: 'Brinjal', emoji: '🍆', type: 'Vegetable', buyPrice: 15, sellPrice: 30, buyQty: 5, unit: 'kg', demand: 'Low', shelfLife: 4, recommendation: 'Optional', reason: 'Low demand — buy only if you have regular customers' },
  { name: 'Bitter Gourd', emoji: '🥒', type: 'Vegetable', buyPrice: 28, sellPrice: 50, buyQty: 3, unit: 'kg', demand: 'Low', shelfLife: 3, recommendation: 'Optional', reason: 'Only health-conscious customers buy this' },
  { name: 'Cabbage', emoji: '🥬', type: 'Vegetable', buyPrice: 10, sellPrice: 22, buyQty: 5, unit: 'kg', demand: 'Low', shelfLife: 5, recommendation: 'Optional', reason: 'Very cheap but low demand in small areas' },
  { name: 'Papaya', emoji: '🍈', type: 'Fruit', buyPrice: 18, sellPrice: 35, buyQty: 3, unit: 'kg', demand: 'Low', shelfLife: 3, recommendation: 'Optional', reason: 'Spoils fast — sell same day' },
];

const RECOMMENDATION_COLORS = {
  'Must Buy': { bg: '#dcfce7', color: '#166534', icon: '✅' },
  'Good to Buy': { bg: '#dbeafe', color: '#1e40af', icon: '👍' },
  'Optional': { bg: '#fef9c3', color: '#854d0e', icon: '⚠️' },
};

export default function SellingPlan({ onNavigate }) {
  const { t } = useApp();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(
    new Set(PLAN_DATA.filter(i => i.recommendation === 'Must Buy').map(i => i.name))
  );

  const filtered = useMemo(() => {
    if (filter === 'All') return PLAN_DATA;
    if (filter === 'Must Buy' || filter === 'Good to Buy' || filter === 'Optional')
      return PLAN_DATA.filter(i => i.recommendation === filter);
    return PLAN_DATA.filter(i => i.type === filter);
  }, [filter]);

  const toggleSelect = (name) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectedItems = PLAN_DATA.filter(i => selected.has(i.name));
  const totalCost = selectedItems.reduce((sum, i) => sum + (i.buyPrice * i.buyQty), 0);
  const totalRevenue = selectedItems.reduce((sum, i) => sum + (i.sellPrice * i.buyQty), 0);
  const totalProfit = totalRevenue - totalCost;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.sellingPlanTitle || '📋 Selling Plan — What to Buy & Sell Today'}</h1>
          <span className="page-subtitle">
            {t.sellingPlanSubtitle || 'Select the items you want to sell. We calculate your cost, earnings, and profit.'}
          </span>
        </div>
      </div>

      <div className="page-body">
        {/* Summary Cards */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#fef2f2' }}>
              <ShoppingCart size={18} color="#ef4444" />
            </div>
            <div className="stat-card-label">{t.totalBuyingCost || 'Total Buying Cost'}</div>
            <div className="stat-card-value">{formatINR(totalCost)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#f0fdf4' }}>
              <DollarSign size={18} color="#16a34a" />
            </div>
            <div className="stat-card-label">{t.expectedEarnings || 'Expected Earnings'}</div>
            <div className="stat-card-value">{formatINR(totalRevenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#eff6ff' }}>
              <TrendingUp size={18} color="#3b82f6" />
            </div>
            <div className="stat-card-label">{t.yourProfit || 'Your Profit'}</div>
            <div className="stat-card-value" style={{ color: '#16a34a' }}>{formatINR(totalProfit)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#f5f3ff' }}>
              <Package size={18} color="#8b5cf6" />
            </div>
            <div className="stat-card-label">{t.itemsSelected || 'Items Selected'}</div>
            <div className="stat-card-value">{selected.size}/{PLAN_DATA.length}</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="card mb-6">
          <div className="card-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All', 'Must Buy', 'Good to Buy', 'Optional', 'Vegetable', 'Fruit'].map(f => (
              <button
                key={f}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
                style={{ fontSize: 13 }}
              >
                {f === 'Must Buy' ? t.filterMustBuy || '✅ Must Buy' : f === 'Good to Buy' ? t.filterGoodToBuy || '👍 Good to Buy' : f === 'Optional' ? t.filterOptional || '⚠️ Optional' : f === 'Vegetable' ? t.filterVegetable || '🥬 Vegetables' : f === 'Fruit' ? t.filterFruit || '🍎 Fruits' : t.filterAll || '🛒 All'}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t.yourSellingPlan || 'Your Selling Plan'}</span>
            <span className="badge badge-green">{filtered.length} {t.items || 'items'}</span>
          </div>
          <div className="card-body" style={{ overflowX: 'auto', padding: 0 }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.select || 'Select'}</th>
                  <th style={thStyle}>{t.item || 'Item'}</th>
                  <th style={thStyle}>{t.recommendation || 'Recommendation'}</th>
                  <th style={thStyle}>{t.buyPrice || 'Buy Price'}</th>
                  <th style={thStyle}>{t.sellPrice || 'Sell Price'}</th>
                  <th style={thStyle}>{t.buyQty || 'Buy Qty'}</th>
                  <th style={thStyle}>{t.totalCost || 'Total Cost'}</th>
                  <th style={thStyle}>{t.totalEarning || 'Total Earning'}</th>
                  <th style={thStyle}>{t.profit || 'Profit'}</th>
                  <th style={thStyle}>{t.shelfLife || 'Shelf Life'}</th>
                  <th style={thStyle}>{t.why || 'Why?'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const isSelected = selected.has(item.name);
                  const cost = item.buyPrice * item.buyQty;
                  const earning = item.sellPrice * item.buyQty;
                  const profit = earning - cost;
                  const rec = RECOMMENDATION_COLORS[item.recommendation];

                  return (
                    <tr
                      key={item.name}
                      onClick={() => toggleSelect(item.name)}
                      style={{
                        background: isSelected ? '#f0fdf4' : (i % 2 === 0 ? '#fff' : '#f8fafc'),
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={tdStyle}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 6,
                          border: isSelected ? '2px solid #16a34a' : '2px solid #cbd5e1',
                          background: isSelected ? '#16a34a' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <Check size={14} color="#fff" />}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 18, marginRight: 8 }}>{item.emoji}</span>
                        <strong>{t[item.name] || item.name}</strong>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          background: rec.bg, color: rec.color,
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        }}>
                          {rec.icon} {t[item.recommendation] || item.recommendation}
                        </span>
                      </td>
                      <td style={tdStyle}>{formatINR(item.buyPrice)}/{t[item.unit] || item.unit}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#16a34a' }}>{formatINR(item.sellPrice)}/{t[item.unit] || item.unit}</td>
                      <td style={tdStyle}>{item.buyQty} {t[item.unit] || item.unit}</td>
                      <td style={tdStyle}>{formatINR(cost)}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#3b82f6' }}>{formatINR(earning)}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#16a34a' }}>{formatINR(profit)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          color: item.shelfLife <= 3 ? '#ef4444' : item.shelfLife <= 7 ? '#f59e0b' : '#22c55e',
                          fontWeight: 600,
                        }}>
                          {item.shelfLife} {t.days || 'days'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#64748b', fontSize: 13, maxWidth: 200 }}>{t[item.reason] || item.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Summary */}
        {selected.size > 0 && (
          <div className="card mt-6">
            <div className="card-header">
              <span className="card-title">{t.yourShoppingList || '📦 Your Shopping List for Today'}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                {selectedItems.map(item => (
                  <div key={item.name} style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: 12, padding: '10px 16px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 20 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{t[item.name] || item.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{item.buyQty} {t[item.unit] || item.unit} × {formatINR(item.buyPrice)} = {formatINR(item.buyPrice * item.buyQty)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                background: '#1e293b', color: '#fff', borderRadius: 16, padding: '20px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>{t.totalCostMandi || 'Total Cost at Mandi'}</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{formatINR(totalCost)}</div>
                </div>
                <div style={{ fontSize: 28, color: '#94a3b8' }}>→</div>
                <div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>{t.youWillEarn || 'You Will Earn'}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#4ade80' }}>{formatINR(totalRevenue)}</div>
                </div>
                <div style={{ fontSize: 28, color: '#94a3b8' }}>→</div>
                <div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>{t.yourProfit || 'Your Profit'}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#22d3ee' }}>{formatINR(totalProfit)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Link to area finder */}
        <div className="card mt-6">
          <div className="card-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{t.whereToSell || 'Where should you sell today?'}</div>
            <p className="text-muted mb-4">{t.findBestAreas || 'Find the best nearby areas to set up your stall for maximum sales.'}</p>
            <button className="btn btn-primary" onClick={() => onNavigate('areaFinder')}>
              {t.btnFindAreas || 'Find Best Selling Areas'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#64748b',
  borderBottom: '2px solid #e2e8f0',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: 14,
  whiteSpace: 'nowrap',
};

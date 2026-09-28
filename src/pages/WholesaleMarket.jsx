import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Search, ArrowRight, ShoppingCart } from 'lucide-react';
import { useApp } from '../hooks/useAppContext';
import { formatINR } from '../utils/helpers';

/* ─── Wholesale Market Data (Mandi Prices) ─────────────────────────────── */

const WHOLESALE_DATA = [
  // Vegetables
  { name: 'Tomato', type: 'Vegetable', unit: 'kg', wholesalePrice: 18, retailPrice: 35, trend: 'up', change: '+₹3', supply: 'Normal', season: 'Year-round', emoji: '🍅' },
  { name: 'Onion', type: 'Vegetable', unit: 'kg', wholesalePrice: 22, retailPrice: 40, trend: 'up', change: '+₹5', supply: 'Low', season: 'Year-round', emoji: '🧅' },
  { name: 'Potato', type: 'Vegetable', unit: 'kg', wholesalePrice: 12, retailPrice: 25, trend: 'stable', change: '₹0', supply: 'High', season: 'Year-round', emoji: '🥔' },
  { name: 'Green Chili', type: 'Vegetable', unit: 'kg', wholesalePrice: 30, retailPrice: 60, trend: 'down', change: '-₹4', supply: 'Normal', season: 'Year-round', emoji: '🌶️' },
  { name: 'Capsicum', type: 'Vegetable', unit: 'kg', wholesalePrice: 35, retailPrice: 65, trend: 'up', change: '+₹2', supply: 'Low', season: 'Year-round', emoji: '🫑' },
  { name: 'Brinjal', type: 'Vegetable', unit: 'kg', wholesalePrice: 15, retailPrice: 30, trend: 'down', change: '-₹2', supply: 'High', season: 'Year-round', emoji: '🍆' },
  { name: 'Cauliflower', type: 'Vegetable', unit: 'piece', wholesalePrice: 20, retailPrice: 40, trend: 'stable', change: '₹0', supply: 'Normal', season: 'Winter', emoji: '🥦' },
  { name: 'Cabbage', type: 'Vegetable', unit: 'kg', wholesalePrice: 10, retailPrice: 22, trend: 'down', change: '-₹3', supply: 'High', season: 'Winter', emoji: '🥬' },
  { name: 'Carrot', type: 'Vegetable', unit: 'kg', wholesalePrice: 25, retailPrice: 45, trend: 'up', change: '+₹4', supply: 'Low', season: 'Winter', emoji: '🥕' },
  { name: 'Bitter Gourd', type: 'Vegetable', unit: 'kg', wholesalePrice: 28, retailPrice: 50, trend: 'stable', change: '₹0', supply: 'Normal', season: 'Summer', emoji: '🥒' },
  { name: 'Lady Finger (Bhindi)', type: 'Vegetable', unit: 'kg', wholesalePrice: 32, retailPrice: 55, trend: 'up', change: '+₹6', supply: 'Low', season: 'Summer', emoji: '🫛' },
  { name: 'Spinach', type: 'Vegetable', unit: 'bunch', wholesalePrice: 8, retailPrice: 20, trend: 'stable', change: '₹0', supply: 'High', season: 'Winter', emoji: '🥬' },
  { name: 'Coriander', type: 'Vegetable', unit: 'bunch', wholesalePrice: 5, retailPrice: 15, trend: 'up', change: '+₹2', supply: 'Normal', season: 'Year-round', emoji: '🌿' },
  { name: 'Ginger', type: 'Vegetable', unit: 'kg', wholesalePrice: 80, retailPrice: 140, trend: 'up', change: '+₹10', supply: 'Low', season: 'Year-round', emoji: '🫚' },
  { name: 'Garlic', type: 'Vegetable', unit: 'kg', wholesalePrice: 60, retailPrice: 100, trend: 'stable', change: '₹0', supply: 'Normal', season: 'Year-round', emoji: '🧄' },
  // Fruits
  { name: 'Banana', type: 'Fruit', unit: 'dozen', wholesalePrice: 25, retailPrice: 50, trend: 'stable', change: '₹0', supply: 'High', season: 'Year-round', emoji: '🍌' },
  { name: 'Apple', type: 'Fruit', unit: 'kg', wholesalePrice: 80, retailPrice: 150, trend: 'up', change: '+₹8', supply: 'Normal', season: 'Autumn', emoji: '🍎' },
  { name: 'Mango', type: 'Fruit', unit: 'kg', wholesalePrice: 40, retailPrice: 80, trend: 'down', change: '-₹5', supply: 'High', season: 'Summer', emoji: '🥭' },
  { name: 'Grapes', type: 'Fruit', unit: 'kg', wholesalePrice: 45, retailPrice: 85, trend: 'stable', change: '₹0', supply: 'Normal', season: 'Winter', emoji: '🍇' },
  { name: 'Papaya', type: 'Fruit', unit: 'kg', wholesalePrice: 18, retailPrice: 35, trend: 'down', change: '-₹3', supply: 'High', season: 'Year-round', emoji: '🍈' },
  { name: 'Watermelon', type: 'Fruit', unit: 'kg', wholesalePrice: 10, retailPrice: 20, trend: 'stable', change: '₹0', supply: 'High', season: 'Summer', emoji: '🍉' },
  { name: 'Pomegranate', type: 'Fruit', unit: 'kg', wholesalePrice: 70, retailPrice: 130, trend: 'up', change: '+₹5', supply: 'Low', season: 'Autumn', emoji: '🍎' },
  { name: 'Orange', type: 'Fruit', unit: 'kg', wholesalePrice: 35, retailPrice: 60, trend: 'stable', change: '₹0', supply: 'Normal', season: 'Winter', emoji: '🍊' },
  { name: 'Guava', type: 'Fruit', unit: 'kg', wholesalePrice: 20, retailPrice: 40, trend: 'down', change: '-₹2', supply: 'High', season: 'Winter', emoji: '🍐' },
  { name: 'Lemon', type: 'Fruit', unit: 'kg', wholesalePrice: 40, retailPrice: 80, trend: 'up', change: '+₹8', supply: 'Low', season: 'Year-round', emoji: '🍋' },
];

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp size={14} color="#ef4444" />;
  if (trend === 'down') return <TrendingDown size={14} color="#22c55e" />;
  return <Minus size={14} color="#94a3b8" />;
};

const SupplyBadge = ({ supply }) => {
  const colors = { High: '#22c55e', Normal: '#f59e0b', Low: '#ef4444' };
  return (
    <span style={{
      background: colors[supply] + '18',
      color: colors[supply],
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
    }}>
      {supply}
    </span>
  );
};

export default function WholesaleMarket({ onNavigate }) {
  const { t } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [lastRefresh] = useState(new Date());

  const filtered = useMemo(() => {
    return WHOLESALE_DATA.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'All' || item.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const avgMargin = useMemo(() => {
    const total = WHOLESALE_DATA.reduce((sum, i) => sum + ((i.retailPrice - i.wholesalePrice) / i.wholesalePrice * 100), 0);
    return (total / WHOLESALE_DATA.length).toFixed(0);
  }, []);

  const priceUp = WHOLESALE_DATA.filter(i => i.trend === 'up').length;
  const priceDown = WHOLESALE_DATA.filter(i => i.trend === 'down').length;
  const lowSupply = WHOLESALE_DATA.filter(i => i.supply === 'Low').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">🏪 Wholesale Market (Mandi)</h1>
          <span className="page-subtitle">
            Today's wholesale prices — Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="page-body">
        {/* Quick Stats */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#f0fdf4' }}>
              <ShoppingCart size={18} color="#16a34a" />
            </div>
            <div className="stat-card-label">Total Items</div>
            <div className="stat-card-value">{WHOLESALE_DATA.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#fef2f2' }}>
              <TrendingUp size={18} color="#ef4444" />
            </div>
            <div className="stat-card-label">Price Going Up</div>
            <div className="stat-card-value">{priceUp}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#f0fdf4' }}>
              <TrendingDown size={18} color="#22c55e" />
            </div>
            <div className="stat-card-label">Price Going Down</div>
            <div className="stat-card-value">{priceDown}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#eff6ff' }}>
              <RefreshCw size={18} color="#3b82f6" />
            </div>
            <div className="stat-card-label">Avg. Profit Margin</div>
            <div className="stat-card-value">{avgMargin}%</div>
          </div>
        </div>

        {/* Tip Banner */}
        <div className="alert alert-success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>💡</span>
          <div>
            {t.tipBuy || 
            <>
            <strong>Tip:</strong> Buy items with <span style={{ color: '#22c55e', fontWeight: 700 }}>green (↓) prices</span> — they're getting cheaper!
            Avoid items with <span style={{ color: '#ef4444', fontWeight: 700 }}>red (↑) prices</span> unless demand is very high.
            Items with <span style={{ color: '#ef4444', fontWeight: 700 }}>Low supply</span> can be sold at higher prices.
            </>
            }
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder={t.searchByName || "Search by name..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: 36 }}
              />
            </div>
            {['All', 'Vegetable', 'Fruit'].map(f => (
              <button
                key={f}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
              >
                {f === 'All' ? `🛒 ${t.all || 'All'}` : f === 'Vegetable' ? `🥬 ${t.Vegetable || 'Vegetable'}s` : `🍎 ${t.Fruit || 'Fruit'}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Price Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t.todaysMandi || "Today's Mandi Prices"}</span>
            <span className="badge badge-green">{filtered.length} {t.item ? t.item.toLowerCase() : "items"}</span>
          </div>
          <div className="card-body" style={{ overflowX: 'auto', padding: 0 }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.item || "Item"}</th>
                  <th style={thStyle}>{t.type || "Type"}</th>
                  <th style={thStyle}>{t.wholesalePrice || "Wholesale Price"}</th>
                  <th style={thStyle}>{t.yourSellingPrice || "Your Selling Price"}</th>
                  <th style={thStyle}>{t.yourProfit || "Your Profit"}</th>
                  <th style={thStyle}>{t.priceChange || "Price Change"}</th>
                  <th style={thStyle}>{t.supply || "Supply"}</th>
                  <th style={thStyle}>{t.season || "Season"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={item.name} style={{
                    background: i % 2 === 0 ? '#fff' : '#f8fafc',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 18, marginRight: 8 }}>{item.emoji}</span>
                      <strong>{t[item.name.replace(/\s+/g, '')] || item.name}</strong>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: item.type === 'Fruit' ? '#fef3c7' : '#dcfce7',
                        color: item.type === 'Fruit' ? '#b45309' : '#166534',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {t[item.type] || item.type}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <strong style={{ color: '#1e293b' }}>{formatINR(item.wholesalePrice)}</strong>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>/{item.unit}</span>
                    </td>
                    <td style={tdStyle}>
                      <strong style={{ color: '#16a34a' }}>{formatINR(item.retailPrice)}</strong>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>/{item.unit}</span>
                    </td>
                    <td style={tdStyle}>
                      <strong style={{ color: '#3b82f6' }}>
                        {formatINR(item.retailPrice - item.wholesalePrice)}
                      </strong>
                      <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>
                        ({((item.retailPrice - item.wholesalePrice) / item.wholesalePrice * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TrendIcon trend={item.trend} />
                        <span style={{
                          color: item.trend === 'up' ? '#ef4444' : item.trend === 'down' ? '#22c55e' : '#94a3b8',
                          fontWeight: 600,
                          fontSize: 13,
                        }}>
                          {item.change}
                        </span>
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <SupplyBadge supply={t[item.supply.toLowerCase()] || item.supply} />
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: 13 }}>
                      {t[item.season === 'Year-round' ? 'yearRound' : item.season.toLowerCase()] || item.season}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="card mt-6">
          <div className="card-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Want to plan what to sell?</div>
            <p className="text-muted mb-4">Go to the Selling Plan page to see exactly what you should buy and sell today.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('sellingPlan')}>
              Open Selling Plan <ArrowRight size={16} />
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

import {
  LayoutDashboard, Leaf, Package, ShoppingCart, TrendingUp,
  Zap, Star, AlertTriangle, BarChart2, Settings, Menu, X, Home,
  Store, ClipboardList, MapPin, Calculator
} from 'lucide-react';
import { useApp } from '../hooks/useAppContext';

const NAV_ITEMS = [
  { id: 'home', icon: Home },
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'vegetables', icon: Leaf },
  { id: 'inventory', icon: Package },
  { id: 'sales', icon: ShoppingCart },
  { id: 'wholesaleMarket', icon: Store },
  { id: 'sellingPlan', icon: ClipboardList },
  { id: 'areaFinder', icon: MapPin },
  { id: 'lppEngine', icon: Calculator },
  { id: 'demandForecast', icon: TrendingUp },
  { id: 'optimization', icon: Zap },
  { id: 'recommendations', icon: Star },
  { id: 'wastage', icon: AlertTriangle },
  { id: 'reports', icon: BarChart2 },
  { id: 'settings', icon: Settings },
];

const ALL_NAV = NAV_ITEMS.map(n => n.id);

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle }) {
  const { t } = useApp();

  return (
    <>
      {/* Desktop Top Navbar (Floating Pill) */}
      <nav className="top-navbar hide-on-mobile">
        <div className="flex-center" style={{ marginRight: 12, marginLeft: 8 }}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="PROFITOSAURIOS Logo" style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
        </div>
        <div className="top-navbar-links" style={{ overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {ALL_NAV.map((id) => {
            const { icon: Icon } = NAV_ITEMS.find(n => n.id === id);
            const isActive = currentPage === id;
            return (
              <button
                key={id}
                className={`top-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => { onNavigate(id); onToggle(false); }}
                title={t[id]}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && <span className="nav-text">{t[id]}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => onToggle(false)}
      />

      {/* Mobile header */}
      <header className="mobile-header">
        <button className="btn-icon" onClick={() => onToggle(!isOpen)}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex-center gap-2">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="PROFITOSAURIOS Logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t.appName}</span>
        </div>
        <div style={{ width: 36 }} />
      </header>

    </>
  );
}

import { useState, useRef, useEffect } from 'react';
import { AppProvider } from './hooks/useAppContext';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Vegetables from './pages/Vegetables';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import DemandForecast from './pages/DemandForecast';
import Optimization from './pages/Optimization';
import Recommendations from './pages/Recommendations';
import Wastage from './pages/Wastage';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import WholesaleMarket from './pages/WholesaleMarket';
import SellingPlan from './pages/SellingPlan';
import AreaFinder from './pages/AreaFinder';
import LPPEngine from './pages/LPPEngine';

const PAGES = {
  home: Home,
  dashboard: Dashboard,
  vegetables: Vegetables,
  inventory: Inventory,
  sales: Sales,
  demandForecast: DemandForecast,
  optimization: Optimization,
  recommendations: Recommendations,
  wastage: Wastage,
  reports: Reports,
  settings: Settings,
  wholesaleMarket: WholesaleMarket,
  sellingPlan: SellingPlan,
  areaFinder: AreaFinder,
  lppEngine: LPPEngine,
};


import VoiceAssistant from './components/VoiceAssistant';

function AppShell() {
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const PageComponent = PAGES[currentPage] || Home;

  return (
    <div className="app-shell">

      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />
      <main className="main-content">
        <PageComponent onNavigate={setCurrentPage} />
      </main>
      <VoiceAssistant />
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { translations } from '../i18n/translations';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [vegetables, setVegetables] = useState(() => storageService.getVegetables());
  const [sales, setSales] = useState(() => storageService.getSales());
  const [wastageRecords, setWastageRecords] = useState(() => storageService.getWastage());
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [optimizationResults, setOptimizationResults] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  const t = translations[settings.language] || translations.en;

  // Fetch settings from Firebase once on mount
  useEffect(() => {
    const fetchFirebaseSettings = async () => {
      try {
        const docRef = doc(db, "app_settings", "demo_user");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({ 
            ...prev, 
            geminiKey: data.geminiKey !== undefined ? data.geminiKey : prev.geminiKey,
            language: data.language || prev.language 
          }));
        }
      } catch (e) {
        // Silently ignore offline errors since we fallback to local storage
        if (e.code !== 'unavailable') {
          console.warn("Failed to load settings from Firebase:", e);
        }
      }
    };
    fetchFirebaseSettings();
  }, []);

  // Persist whenever data changes
  useEffect(() => { storageService.saveVegetables(vegetables); }, [vegetables]);
  useEffect(() => { storageService.saveSales(sales); }, [sales]);
  useEffect(() => { storageService.saveWastage(wastageRecords); }, [wastageRecords]);
  useEffect(() => { storageService.saveSettings(settings); }, [settings]);

  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const addVegetable = useCallback((veg) => {
    setVegetables(prev => [...prev, veg]);
  }, []);

  const updateVegetable = useCallback((id, updates) => {
    setVegetables(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, []);

  const deleteVegetable = useCallback((id) => {
    setVegetables(prev => prev.filter(v => v.id !== id));
  }, []);

  const addSale = useCallback((sale) => {
    setSales(prev => [...prev, sale]);
  }, []);

  const updateSale = useCallback((id, updates) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteSale = useCallback((id) => {
    setSales(prev => prev.filter(s => s.id !== id));
  }, []);

  const addWastageRecord = useCallback((record) => {
    setWastageRecords(prev => [...prev, record]);
  }, []);

  const clearAllData = useCallback(() => {
    storageService.clearAll();
    setVegetables([]);
    setSales([]);
    setWastageRecords([]);
    setOptimizationResults([]);
    setAiAnalysis(null);
    setSettings(storageService.getSettings());
  }, []);

  const value = {
    vegetables, sales, wastageRecords, settings,
    optimizationResults, setOptimizationResults,
    aiAnalysis, setAiAnalysis,
    isLoading, setIsLoading,
    loadingStep, setLoadingStep,
    t,
    updateSettings,
    addVegetable, updateVegetable, deleteVegetable,
    addSale, updateSale, deleteSale,
    addWastageRecord,
    clearAllData,
    setVegetables, setSales,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

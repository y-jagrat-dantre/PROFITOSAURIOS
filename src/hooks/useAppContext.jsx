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

  // Fetch data from Firebase once on mount
  useEffect(() => {
    const fetchFirebaseSettings = async () => {
      try {
        // Fetch Settings
        const docSnap = await getDoc(doc(db, "app_settings", "demo_user"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({ 
            ...prev, 
            geminiKey: data.geminiKey !== undefined ? data.geminiKey : prev.geminiKey,
            language: data.language || prev.language 
          }));
        }
        
        // Fetch App Data
        const vegSnap = await getDoc(doc(db, "app_data", "vegetables"));
        if (vegSnap.exists()) setVegetables(vegSnap.data().data || []);
        
        const salesSnap = await getDoc(doc(db, "app_data", "sales"));
        if (salesSnap.exists()) setSales(salesSnap.data().data || []);
        
        const wastageSnap = await getDoc(doc(db, "app_data", "wastage"));
        if (wastageSnap.exists()) setWastageRecords(wastageSnap.data().data || []);
        
      } catch (e) {
        // Silently ignore offline errors since we fallback to local storage
        if (e.code !== 'unavailable') {
          console.warn("Failed to load from Firebase:", e);
        }
      }
    };
    fetchFirebaseSettings();
  }, []);

  // Persist whenever data changes
  useEffect(() => { 
    storageService.saveVegetables(vegetables); 
    if (vegetables.length > 0) {
      import('firebase/firestore').then(({ doc, setDoc }) => {
        setDoc(doc(db, "app_data", "vegetables"), { data: vegetables }).catch(console.error);
      });
    }
  }, [vegetables]);
  
  useEffect(() => { 
    storageService.saveSales(sales); 
    if (sales.length > 0) {
      import('firebase/firestore').then(({ doc, setDoc }) => {
        setDoc(doc(db, "app_data", "sales"), { data: sales }).catch(console.error);
      });
    }
  }, [sales]);
  
  useEffect(() => { 
    storageService.saveWastage(wastageRecords); 
    if (wastageRecords.length > 0) {
      import('firebase/firestore').then(({ doc, setDoc }) => {
        setDoc(doc(db, "app_data", "wastage"), { data: wastageRecords }).catch(console.error);
      });
    }
  }, [wastageRecords]);
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

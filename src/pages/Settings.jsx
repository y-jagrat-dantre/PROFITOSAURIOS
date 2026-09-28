import { useState, useEffect } from 'react';
import { useApp } from '../hooks/useAppContext';
import { DEMO_VEGETABLES, generateDemoSales } from '../data/demoData';
import { genId } from '../utils/helpers';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function Settings() {
  const { settings, updateSettings, clearAllData, setVegetables, setSales, t, vegetables } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  // Sync form when settings load from local storage
  useEffect(() => {
    setForm(prev => ({ ...prev, ...settings }));
  }, [settings]);

  function handleSave() {
    updateSettings(form);
    
    // Save the API key and preferences to Firebase database in the background
    setDoc(doc(db, "app_settings", "demo_user"), {
      geminiKey: form.geminiKey || '',
      language: form.language || 'en',
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(error => {
      console.error("Failed to save to Firebase:", error);
    });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLoadDemo() {
    if (vegetables.length > 0 && !window.confirm('This will add demo vegetables and sales data. Continue?')) return;
    const demoVegs = DEMO_VEGETABLES.map(v => ({ ...v, id: genId() }));
    setVegetables(demoVegs);
    const demoSales = generateDemoSales(demoVegs);
    setSales(demoSales);
    alert('Demo data loaded! Go to Dashboard to generate today\'s plan.');
  }

  function handleClearAll() {
    if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      clearAllData();
      alert('All data cleared.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.settings}</h1>
          <span className="page-subtitle">{t.configurePreferences || 'Configure your preferences'}</span>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* General settings */}
          <div className="card">
            <div className="card-header"><span className="card-title">{t.generalSettings || 'General Settings'}</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">{t.budget}</label>
                <input type="number" className="form-input" value={form.budget} min="0"
                  onChange={e => setForm(p => ({ ...p, budget: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t.storageAvailable}</label>
                <input type="number" className="form-input" value={form.storageCapacity} min="0"
                  onChange={e => setForm(p => ({ ...p, storageCapacity: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t.optimizationMode}</label>
                <select className="form-select" value={form.optimizationMode}
                  onChange={e => setForm(p => ({ ...p, optimizationMode: e.target.value }))}>
                  <option value="maxProfit">{t.maxProfit}</option>
                  <option value="balanced">{t.balanced}</option>
                  <option value="maxSales">{t.maxSales}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t.language}</label>
                <select className="form-select" value={form.language}
                  onChange={e => setForm(p => ({ ...p, language: e.target.value }))}>
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="ur">اردو (Urdu)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="or">ଓଡ଼ିଆ (Odia)</option>
                  <option value="ml">മലയാളം (Malayalam)</option>
                  <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="as">অসমীয়া (Assamese)</option>
                  <option value="mai">मैथिली (Maithili)</option>
                  <option value="ne">नेपाली (Nepali)</option>
                  <option value="sd">سنڌي (Sindhi)</option>
                  <option value="sa">संस्कृत (Sanskrit)</option>
                  <option value="bho">भोजपुरी (Bhojpuri)</option>
                  <option value="doi">डोगरी (Dogri)</option>
                  <option value="gom">कोंकणी (Konkani)</option>
                  <option value="mni">মৈতৈলোন (Manipuri)</option>
                  <option value="ks">कॉशुर (Kashmiri)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t.geminiKeyLabel || 'Gemini API Key (Voice AI)'}</label>
                <input type="password" className="form-input" value={form.geminiKey || ''} placeholder="AIzaSy..."
                  onChange={e => setForm(p => ({ ...p, geminiKey: e.target.value }))} />
                <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>{t.geminiKeyHelp || 'Required for the ChatGPT-like Voice Assistant to work.'}</span>
              </div>
              <button className="btn btn-primary w-full" onClick={handleSave}>
                {saved ? '✓ Saved!' : `${t.save} ${t.settings}`}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="card">
            <div className="card-header"><span className="card-title">How PROFITOSAURIOS Works</span></div>
            <div className="card-body">
              <div style={{ fontSize: 13, lineHeight: 1.8, color: '#475569' }}>
                <strong>1. Add Vegetables</strong> — Enter your stock, prices, and expected demand.<br /><br />
                <strong>2. Enter Budget & Storage</strong> — Set your daily investment limit and available storage space.<br /><br />
                <strong>3. Add Sales History</strong> — Import or enter past sales for better predictions.<br /><br />
                <strong>4. Generate Today's Plan</strong> — The system runs mathematical optimization and smart analysis to recommend what to buy and how much.<br /><br />
                <strong>5. Follow Recommendations</strong> — See expected revenue, profit, and wastage for each vegetable.<br /><br />
                <div className="alert alert-info mt-3" style={{ fontSize: 12 }}>
                  All predictions are <strong>estimates</strong> based on your data. Actual results may vary.
                </div>
              </div>
            </div>
          </div>

          {/* Data management */}
          <div className="card">
            <div className="card-header"><span className="card-title">{t.dataManagement || 'Data Management'}</span></div>
            <div className="card-body">
              <div className="mb-4">
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.loadDemo}</div>
                <p className="text-sm text-muted mb-3">{t.loadDemoDesc || 'Load 12 sample vegetables with 30 days of realistic sales data to explore all features.'}</p>
                <button className="btn btn-secondary w-full" onClick={handleLoadDemo}>
                  🌱 {t.loadDemo}
                </button>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6, color: '#ef4444' }}>{t.clearData}</div>
                <p className="text-sm text-muted mb-3">{t.clearDataDesc || 'Permanently delete all vegetables, sales, and wastage records.'}</p>
                <button className="btn btn-danger w-full" onClick={handleClearAll}>
                  🗑 {t.clearData}
                </button>
              </div>
            </div>
          </div>

          {/* Pricing info */}
          <div className="card">
            <div className="card-header"><span className="card-title">{t.priceRecommendations || 'Price Recommendations'}</span></div>
            <div className="card-body">
              {vegetables.length === 0 ? (
                <p className="text-muted text-sm">{t.addVegetablesToSee || 'Add vegetables to see pricing recommendations.'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {vegetables.slice(0, 6).map(veg => {
                    const margin = veg.sellingPrice - veg.purchasePrice;
                    const marginPct = veg.sellingPrice > 0 ? (margin / veg.sellingPrice * 100).toFixed(0) : 0;
                    const suggestedLow = Math.round(veg.purchasePrice * 1.3);
                    const suggestedHigh = Math.round(veg.purchasePrice * 1.6);
                    return (
                      <div key={veg.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{t[veg.name] || veg.name}</div>
                        <div className="text-sm text-muted">{t.currentPrice || 'Current Price'}: ₹{veg.sellingPrice}/{t.unitKg || 'kg'}</div>
                        <div className="text-sm" style={{ color: '#16a34a' }}>
                          {t.suggestedRange || 'Suggested Range'}: ₹{suggestedLow} – ₹{suggestedHigh}/{t.unitKg || 'kg'}
                        </div>
                        <div className="text-sm text-muted">{t.currentMargin || 'Current Margin'}: ₹{margin}/{t.unitKg || 'kg'} ({marginPct}%)</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Calculator, CheckCircle2, ChevronRight, XCircle, Cloud, CloudRain, Sun, ShoppingCart, Send, TrendingUp, AlertTriangle } from 'lucide-react';
import { useApp } from '../hooks/useAppContext';

export default function LPPEngine() {
  const { t } = useApp();
  const [step, setStep] = useState(1);
  
  // Step 1 Form State
  const [formData, setFormData] = useState({
    product: 'Tomato',
    demand: 45,
    currentStock: 10,
    costPrice: 40,
    sellingPrice: 60,
    budget: 5000,
    weather: 'Normal' // Normal, Rainy, Hot
  });

  // LPP Calculated State
  const [lppResult, setLppResult] = useState(null);

  // Mock Wholesalers Database
  const mockWholesalers = [
    { id: 'W1', name: 'Ramesh Traders', price: 40, available: 100, rating: 4.8, type: 'Premium' },
    { id: 'W2', name: 'Fresh Farm Hub', price: 37, available: 20, rating: 4.5, type: 'Economy' },
    { id: 'W3', name: 'Kisan Wholesale', price: 39, available: 50, rating: 4.2, type: 'Standard' },
  ];

  const handleOptimize = () => {
    // 1. Weather Adjustment
    let adjDemand = Number(formData.demand);
    if (formData.weather === 'Rainy') adjDemand = Math.floor(adjDemand * 0.8);
    if (formData.weather === 'Hot') adjDemand = Math.floor(adjDemand * 1.1);

    // 2. Constraints Calculation
    const maxByDemand = Math.max(0, adjDemand - Number(formData.currentStock));
    const maxByBudget = Math.floor(Number(formData.budget) / Number(formData.costPrice));

    // 3. Objective function: Maximize Profit
    // Z = (S - C) * x 
    // Subject to: x <= maxByDemand and x * C <= Budget
    const recommendedQty = Math.min(maxByDemand, maxByBudget);
    const expectedProfit = recommendedQty * (Number(formData.sellingPrice) - Number(formData.costPrice));
    const budgetUsed = recommendedQty * Number(formData.costPrice);

    setLppResult({
      adjDemand,
      maxByDemand,
      maxByBudget,
      recommendedQty,
      expectedProfit,
      budgetUsed
    });
    setStep(2);
  };

  const handleFindSuppliers = () => {
    setStep(3);
  };

  return (
    <div>
      <div className="page-header" style={{ borderBottom: 'none', background: 'transparent', padding: '20px 40px' }}>
        <div className="page-header-left">
          <h1 className="page-title" style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(to right, #16a34a, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t.lppProcurementEngine || 'LPP Procurement Engine'}
          </h1>
          <span className="page-subtitle" style={{ fontSize: 14, fontWeight: 500, letterSpacing: '0.02em' }}>{t.profitosauriosProfitOptimizationModel || 'PROFITOSAURIOS Profit Optimization Model'}</span>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 80 }}>
        
        {/* Stepper UI */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40, background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: 99, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          {[
            { num: 1, label: 'Constraints' },
            { num: 2, label: 'Mathematical Result' },
            { num: 3, label: 'Smart Suppliers' }
          ].map((s, i) => {
            const isActive = step >= s.num;
            return (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.4, transition: 'all 0.3s ease' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', 
                  background: isActive ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#cbd5e1',
                  boxShadow: isActive ? '0 4px 12px rgba(22, 163, 74, 0.4)' : 'none',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15
                }}>{s.num}</div>
                <span style={{ fontWeight: 700, marginLeft: 12, color: isActive ? '#0f172a' : '#64748b', fontSize: 14 }}>{s.label}</span>
                {i < 2 && <ChevronRight style={{ margin: '0 20px', color: '#cbd5e1' }} />}
              </div>
            );
          })}
        </div>

        {/* STEP 1: INPUT CONSTRAINTS */}
        {step === 1 && (
          <div className="card" style={{ padding: '40px', borderRadius: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 16, color: '#16a34a' }}>
                <Calculator size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{t.businessConstraints || 'Business Constraints'}</h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>{t.enterYourExactVariablesSoTheEngineCanMaximizeYourProfit || 'Enter your exact variables so the engine can maximize your profit.'}</p>
              </div>
            </div>
            
            <div className="form-grid" style={{ gap: 24, marginBottom: 24 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#475569' }}>{t.productName || 'Product Name'}</label>
                <input type="text" className="form-input" style={{ fontSize: 16, padding: '12px 16px', borderRadius: 12 }} value={formData.product} onChange={e => setFormData({...formData, product: e.target.value})} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#475569' }}>{t.weatherCondition || 'Weather Condition'}</label>
                <select className="form-select" style={{ fontSize: 16, padding: '12px 16px', borderRadius: 12 }} value={formData.weather} onChange={e => setFormData({...formData, weather: e.target.value})}>
                  <option value="Normal">{t.normalNoChange || 'Normal 🌤️ (No Change)'}</option>
                  <option value="Rainy">{t.rainyDemand20 || 'Rainy 🌧️ (Demand -20%)'}</option>
                  <option value="Hot">{t.hotDemand10 || 'Hot ☀️ (Demand +10%)'}</option>
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ gap: 24, marginBottom: 24 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#475569' }}>{t.expectedDemandKg || 'Expected Demand (kg)'}</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" className="form-input" style={{ fontSize: 16, padding: '12px 16px', borderRadius: 12, paddingRight: 40 }} value={formData.demand} onChange={e => setFormData({...formData, demand: e.target.value})} />
                  <span style={{ position: 'absolute', right: 16, top: 12, color: '#94a3b8', fontWeight: 600 }}>{t.kg || 'kg'}</span>
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#475569' }}>{t.currentStockKg || 'Current Stock (kg)'}</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" className="form-input" style={{ fontSize: 16, padding: '12px 16px', borderRadius: 12, paddingRight: 40 }} value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} />
                  <span style={{ position: 'absolute', right: 16, top: 12, color: '#94a3b8', fontWeight: 600 }}>{t.kg || 'kg'}</span>
                </div>
              </div>
            </div>

            <div className="form-grid" style={{ gap: 24, marginBottom: 40 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#475569' }}>{t.costPrice || 'Cost Price'}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: 12, color: '#94a3b8', fontWeight: 600 }}>₹</span>
                  <input type="number" className="form-input" style={{ fontSize: 16, padding: '12px 16px 12px 32px', borderRadius: 12 }} value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#475569' }}>{t.sellingPrice || 'Selling Price'}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: 12, color: '#94a3b8', fontWeight: 600 }}>₹</span>
                  <input type="number" className="form-input" style={{ fontSize: 16, padding: '12px 16px 12px 32px', borderRadius: 12 }} value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#475569' }}>{t.availableBudget || 'Available Budget'}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: 12, color: '#94a3b8', fontWeight: 600 }}>₹</span>
                  <input type="number" className="form-input" style={{ fontSize: 16, padding: '12px 16px 12px 32px', borderRadius: 12 }} value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
                </div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleOptimize} style={{ width: '100%', padding: '18px', fontSize: 16, borderRadius: 16, justifyContent: 'center', background: 'linear-gradient(to right, #16a34a, #059669)', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.3)' }}>
              <TrendingUp size={20} /> {t.runOptimizationModel || 'RUN OPTIMIZATION MODEL'}
            </button>
          </div>
        )}

        {/* STEP 2: LPP RESULT */}
        {step === 2 && lppResult && (
          <div className="card" style={{ overflow: 'hidden', padding: 0, borderRadius: 32, border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
            <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #1e40af 100%)', color: '#fff', padding: '50px 40px', textAlign: 'center', position: 'relative' }}>
              
              <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, backdropFilter: 'blur(10px)' }}>
                {t['100Optimized'] || '100% OPTIMIZED'}
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 700, opacity: 0.9, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.optimalPurchaseQuantity || 'Optimal Purchase Quantity'}</h2>
              <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, textShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                {lppResult.recommendedQty} <span style={{ fontSize: 32, opacity: 0.8 }}>{t.kg || 'kg'}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 12, opacity: 0.9 }}>{formData.product}</div>
            </div>

            <div style={{ padding: '40px' }}>
              <div style={{ background: '#f8fafc', padding: '24px 32px', borderRadius: 20, marginBottom: 32, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{t.mathematicalObjectiveAchieved || 'Mathematical Objective Achieved'}</h3>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                    {t.maxZSCx || 'Max Z = ∑ (S - C)x'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{t.expectedProfit || 'Expected Profit'}</div>
                  <div style={{ fontSize: 28, color: '#16a34a', fontWeight: 900 }}>
                    ₹{lppResult.expectedProfit.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: '#0f172a' }}>{t.constraintVerification || 'Constraint Verification'}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, color: '#166534', fontSize: 15 }}>
                    <CheckCircle2 size={20} color="#22c55e" /> {t.budgetConstraint || 'Budget Constraint'}
                  </div>
                  <div style={{ fontWeight: 800, color: '#15803d', fontSize: 16 }}>₹{lppResult.budgetUsed.toLocaleString('en-IN')} <span style={{ opacity: 0.5 }}>/ ₹{Number(formData.budget).toLocaleString('en-IN')} used</span></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, color: '#166534', fontSize: 15 }}>
                    <CheckCircle2 size={20} color="#22c55e" /> {t.totalVolume || 'Total Volume'}
                  </div>
                  <div style={{ fontWeight: 800, color: '#15803d', fontSize: 16 }}>
                    {lppResult.recommendedQty} + {formData.currentStock} = {lppResult.recommendedQty + Number(formData.currentStock)} kg <span style={{ opacity: 0.5 }}>(Max: {lppResult.adjDemand} kg)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: formData.weather !== 'Normal' ? '#eff6ff' : '#f8fafc', border: formData.weather !== 'Normal' ? '1px solid #bfdbfe' : '1px solid #e2e8f0', borderRadius: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, color: formData.weather !== 'Normal' ? '#1e40af' : '#475569', fontSize: 15 }}>
                    {formData.weather === 'Rainy' ? <CloudRain size={20} /> : formData.weather === 'Hot' ? <Sun size={20} /> : <Cloud size={20} />} Weather Adjusted Demand
                  </div>
                  <div style={{ fontWeight: 800, color: formData.weather !== 'Normal' ? '#1e40af' : '#0f172a', fontSize: 16 }}>
                    {lppResult.adjDemand} kg
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20 }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ padding: '16px 32px', borderRadius: 16, fontSize: 15 }}>{t.modifyInputs || 'Modify Inputs'}</button>
                <button className="btn btn-primary" onClick={handleFindSuppliers} style={{ flex: 1, justifyContent: 'center', padding: '16px', borderRadius: 16, fontSize: 16, background: '#0f172a', color: '#fff' }}>
                  <ShoppingCart size={18} /> {t.proceedToWholesalers || 'Proceed to Wholesalers'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SMART WHOLESALER COMPARISON */}
        {step === 3 && lppResult && (
          <div>
            <div className="card" style={{ background: 'linear-gradient(to right, #eff6ff, #f0fdf4)', padding: '24px 32px', borderRadius: 24, marginBottom: 32, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ background: '#3b82f6', color: '#fff', padding: 16, borderRadius: '50%' }}>
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e40af', margin: '0 0 4px 0' }}>{t.smartMatchingActive || 'Smart Matching Active'}</h3>
                <p style={{ margin: 0, color: '#334155', fontSize: 15 }}>{t.findingWholesalersWhoCanFulfillYourExactLppRequirementOf || 'Finding wholesalers who can fulfill your exact LPP requirement of'} <strong>{lppResult.recommendedQty} kg</strong>.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {mockWholesalers.map(ws => {
                const canFulfill = ws.available >= lppResult.recommendedQty;
                const totalCost = canFulfill ? (ws.price * lppResult.recommendedQty) : null;
                
                return (
                  <div key={ws.id} className="card" style={{ padding: '28px', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: canFulfill ? '2px solid #22c55e' : '1px solid #e2e8f0', boxShadow: canFulfill ? '0 12px 32px rgba(34,197,94,0.15)' : 'none', position: 'relative', overflow: 'hidden' }}>
                    
                    {!canFulfill && (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.6)', zIndex: 1 }} />
                    )}

                    <div style={{ flex: 1, zIndex: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>{ws.name}</h3>
                        <span className="badge" style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>⭐ {ws.rating}</span>
                        {canFulfill && <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{ws.type}</span>}
                      </div>
                      
                      <div style={{ display: 'flex', gap: 32, color: '#475569', fontSize: 15, marginBottom: 20 }}>
                        <div><strong style={{ color: '#0f172a' }}>{t.rate || 'Rate:'}</strong> ₹{ws.price}/kg</div>
                        <div><strong style={{ color: '#0f172a' }}>{t.stock || 'Stock:'}</strong> {ws.available} kg</div>
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: canFulfill ? '#f0fdf4' : '#fef2f2', color: canFulfill ? '#166534' : '#991b1b', fontWeight: 700, fontSize: 14 }}>
                        {canFulfill ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} 
                        {canFulfill ? '100% Match' : `Cannot fulfill ${lppResult.recommendedQty} kg requirement`}
                      </div>
                    </div>

                    {canFulfill && (
                      <div style={{ textAlign: 'right', zIndex: 2, borderLeft: '1px solid #e2e8f0', paddingLeft: 40, minWidth: 220 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{t.calculatedCost || 'Calculated Cost'}</div>
                        <div style={{ fontSize: 36, fontWeight: 900, color: '#16a34a', marginBottom: 16 }}>₹{totalCost.toLocaleString('en-IN')}</div>
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 12, fontSize: 15 }}>
                          <Send size={16} /> {t.sendRequest || 'Send Request'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ padding: '12px 24px', borderRadius: 99, fontWeight: 600 }}>{t.backToLppResult || '← Back to LPP Result'}</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

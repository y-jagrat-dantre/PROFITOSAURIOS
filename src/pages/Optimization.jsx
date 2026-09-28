import { useState } from 'react';
import { useApp } from '../hooks/useAppContext';
import { optimize, buildModelString } from '../optimization/optimizer';
import { formatINR, formatKg } from '../utils/helpers';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Optimization() {
  const { vegetables, settings, updateSettings, setOptimizationResults, t } = useApp();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localBudget, setLocalBudget] = useState(settings.budget);
  const [localStorage, setLocalStorage] = useState(settings.storageCapacity);
  const [localMode, setLocalMode] = useState(settings.optimizationMode);
  const [results, setResults] = useState([]);
  const [ran, setRan] = useState(false);

  function handleRun() {
    updateSettings({ budget: localBudget, storageCapacity: localStorage, optimizationMode: localMode });
    const r = optimize(vegetables, localBudget, localStorage, localMode);
    setResults(r);
    setOptimizationResults(r);
    setRan(true);
  }

  const model = vegetables.length > 0 ? buildModelString(vegetables, localBudget, localStorage, localMode) : null;

  const totalBudgetUsed = results.reduce((s, r) => s + r.budgetUsed, 0);
  const totalProfit = results.reduce((s, r) => s + r.expectedProfit, 0);
  const totalRevenue = results.reduce((s, r) => s + r.expectedRevenue, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.optimization}</h1>
          <span className="page-subtitle">{t.mathematicalStockOptimization || 'Mathematical stock optimization'}</span>
        </div>
      </div>

      <div className="page-body">
        {/* Configuration */}
        <div className="card mb-6">
          <div className="card-header">
            <span className="card-title">{t.optimizationSettings || 'Optimization Settings'}</span>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{t.budget}</label>
                <input type="number" className="form-input" value={localBudget} min="0"
                  onChange={e => setLocalBudget(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">{t.storageAvailable}</label>
                <input type="number" className="form-input" value={localStorage} min="0"
                  onChange={e => setLocalStorage(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t.optimizationMode}</label>
              <div className="toggle-group" style={{ width: 'fit-content' }}>
                {['maxProfit', 'balanced', 'maxSales'].map(m => (
                  <button key={m} className={`toggle-btn ${localMode === m ? 'active' : ''}`}
                    onClick={() => setLocalMode(m)}>
                    {m === 'maxProfit' ? t.maxProfit : m === 'maxSales' ? t.maxSales : t.balanced}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary mt-4" onClick={handleRun} disabled={vegetables.length === 0}>
              {t.runOptimization || 'Run Optimization'}
            </button>
            {vegetables.length === 0 && (
              <div className="text-muted text-sm mt-2">{t.addVegetablesFirstToRunOptimization || 'Add vegetables first to run optimization.'}</div>
            )}
          </div>
        </div>

        {/* Results */}
        {ran && results.length > 0 && (
          <>
            <div className="stats-grid mb-4">
              {[
                { label: 'Budget Used', value: formatINR(totalBudgetUsed) + ' / ' + formatINR(localBudget), color: '#f59e0b' },
                { label: t.expectedRevenue, value: formatINR(totalRevenue), color: '#16a34a' },
                { label: t.expectedProfit, value: formatINR(totalProfit), color: '#3b82f6' },
              ].map(({ label, value, color }) => (
                <div className="stat-card" key={label}>
                  <div className="stat-card-label">{label}</div>
                  <div className="stat-card-value" style={{ color, fontSize: 18 }}>{value}</div>
                </div>
              ))}
            </div>

            <div className="table-wrap mb-6">
              <table>
                <thead>
                  <tr>
                    <th>{t.vegetable || 'Vegetable'}</th>
                    <th>{t.recQty || 'Rec. Qty'}</th>
                    <th>{t.budgetUsed || 'Budget Used'}</th>
                    <th>{t.expSales || 'Exp. Sales'}</th>
                    <th>{t.expRevenue || 'Exp. Revenue'}</th>
                    <th>{t.expProfit || 'Exp. Profit'}</th>
                    <th>{t.margin || 'Margin'}</th>
                    <th>{t.demand || 'Demand'}</th>
                    <th>{t.wastage || 'Wastage'}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.vegetable.id}>
                      <td style={{ fontWeight: 600 }}>{r.vegetable.name}</td>
                      <td>{r.recommendedQty} kg</td>
                      <td>{formatINR(r.budgetUsed)}</td>
                      <td>{r.expectedSales} kg</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatINR(r.expectedRevenue)}</td>
                      <td style={{ color: '#3b82f6', fontWeight: 600 }}>{formatINR(r.expectedProfit)}</td>
                      <td>{r.profitMargin}%</td>
                      <td>
                        <span className={`badge ${r.demandLevel === 'High' ? 'badge-green' : r.demandLevel === 'Medium' ? 'badge-yellow' : 'badge-gray'}`}>
                          {r.demandLevel}
                        </span>
                      </td>
                      <td>{formatINR(r.expectedWastage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* How it works */}
        <div className="card mb-4">
          <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setShowAdvanced(!showAdvanced)}>
            <span className="card-title">{t.howItWorks}</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {!showAdvanced && (
            <div className="card-body">
              <div className="text-sm" style={{ lineHeight: 1.8 }}>
                {t.theSystemConsiders || 'The system considers:'}<br />
                <span style={{ color: '#16a34a' }}>{t.availableBudget || 'Available Budget'}</span> + <span style={{ color: '#16a34a' }}>{t.storageCapacity || 'Storage Capacity'}</span> +
                <span style={{ color: '#16a34a' }}> {t.expectedDemand || 'Expected Demand'}</span> + <span style={{ color: '#16a34a' }}> {t.purchaseCost || 'Purchase Cost'}</span> +
                <span style={{ color: '#16a34a' }}> {t.sellingPrice || 'Selling Price'}</span> + <span style={{ color: '#16a34a' }}> {t.wastageRisk || 'Wastage Risk'}</span><br />
                → <strong>{t.recommendedStock || 'Recommended Stock'}</strong><br /><br />
                {t.theOptimizerAllocatesBudgetToVegetablesGreedilyByScoreProfitSalesOrBothDependingOnModeRespectingAllConstraints || 'The optimizer allocates budget to vegetables greedily by score (profit, sales, or both depending on mode), respecting all constraints.'}
              </div>
            </div>
          )}
        </div>

        {/* Advanced model */}
        {model && (
          <div className="card">
            <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setShowAdvanced(!showAdvanced)}>
              <span className="card-title">{t.advancedModel}</span>
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {showAdvanced && (
              <div className="card-body">
                <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 2, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                  <div className="text-muted">{t.decisionVariables || 'Decision Variables:'}</div>
                  <pre style={{ margin: 0, fontSize: 12 }}>{model.variables}</pre>
                  <br />
                  <div className="text-muted">{t.maximize || 'Maximize:'}</div>
                  <div>Profit = {model.objective}</div>
                  <br />
                  <div className="text-muted">{t.subjectTo || 'Subject to:'}</div>
                  <div>{model.budgetConstraint}</div>
                  <div>{model.storageConstraint}</div>
                  <pre style={{ margin: 0, fontSize: 12 }}>{model.demandConstraints}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useApp } from '../hooks/useAppContext';
import { genId, formatINR, wastageRiskBadge } from '../utils/helpers';
import { WASTAGE_REASONS } from '../data/demoData';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const PIE_COLORS = ['#16a34a', '#ef4444', '#94a3b8'];

export default function Wastage() {
  const { vegetables, wastageRecords, addWastageRecord, t } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    vegetableName: '',
    stockPurchased: '',
    stockSold: '',
    stockWasted: '',
    reason: 'Unsold',
  });
  const [errors, setErrors] = useState({});

  const highRisk = vegetables.filter(v => v.wastageRate >= 10).sort((a, b) => b.wastageRate - a.wastageRate);
  const mediumRisk = vegetables.filter(v => v.wastageRate >= 5 && v.wastageRate < 10);
  const lowRisk = vegetables.filter(v => v.wastageRate < 5);

  // Aggregate wastage data
  const wastageByVeg = {};
  wastageRecords.forEach(r => {
    if (!wastageByVeg[r.vegetableName]) wastageByVeg[r.vegetableName] = { sold: 0, wasted: 0, purchased: 0 };
    wastageByVeg[r.vegetableName].sold += parseFloat(r.stockSold) || 0;
    wastageByVeg[r.vegetableName].wasted += parseFloat(r.stockWasted) || 0;
    wastageByVeg[r.vegetableName].purchased += parseFloat(r.stockPurchased) || 0;
  });

  const totalSold = Object.values(wastageByVeg).reduce((s, v) => s + v.sold, 0);
  const totalWasted = Object.values(wastageByVeg).reduce((s, v) => s + v.wasted, 0);
  const totalPurchased = Object.values(wastageByVeg).reduce((s, v) => s + v.purchased, 0);
  const totalRemaining = Math.max(0, totalPurchased - totalSold - totalWasted);

  const pieData = [
    { name: 'Sold', value: Math.round(totalSold) },
    { name: 'Wasted', value: Math.round(totalWasted) },
    { name: 'Remaining', value: Math.round(totalRemaining) },
  ].filter(d => d.value > 0);

  function validate() {
    const e = {};
    if (!form.vegetableName) e.vegetableName = 'Required';
    if (!form.stockPurchased || form.stockPurchased <= 0) e.stockPurchased = 'Required';
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    addWastageRecord({ id: genId(), ...form });
    setShowModal(false);
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.wastageMonitor}</h1>
          <span className="page-subtitle">{t.trackAndReduceWastage || 'Track and reduce wastage'}</span>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> {t.recordWastage}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Wastage risk levels */}
        {highRisk.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">🔴 {t.highWastageRisk}</span>
            </div>
            <div className="card-body">
              {highRisk.map(veg => {
                const reduceBy = Math.round(veg.availableQuantity * veg.wastageRate / 100);
                return (
                  <div key={veg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{veg.name}</div>
                      <div className="text-sm text-muted">Wastage rate: {veg.wastageRate}% — Est. loss: {formatINR(veg.availableQuantity * (veg.wastageRate / 100) * veg.purchasePrice)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-red" style={{ fontSize: 14 }}>{veg.wastageRate}%</span>
                      {reduceBy > 0 && (
                        <div className="text-sm text-muted mt-2">Reduce stock by ~{reduceBy} kg</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mediumRisk.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">{t.mediumWastageRisk || '🟡 Medium Wastage Risk'}</span>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {mediumRisk.map(veg => (
                <div key={veg.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 14px' }}>
                  <div style={{ fontWeight: 600 }}>{veg.name}</div>
                  <div className="text-sm" style={{ color: '#92400e' }}>{veg.wastageRate}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pie chart */}
        {wastageRecords.length > 0 && pieData.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">{t.stockDistribution || 'Stock Distribution'}</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value} kg`}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => [v + ' kg']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Wastage records */}
        {wastageRecords.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.date || 'Date'}</th>
                  <th>{t.vegetable || 'Vegetable'}</th>
                  <th>{t.stockPurchased}</th>
                  <th>{t.stockSold}</th>
                  <th>{t.stockWasted}</th>
                  <th>{t.reason || 'Reason'}</th>
                </tr>
              </thead>
              <tbody>
                {wastageRecords.slice().reverse().map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>{r.vegetableName}</td>
                    <td>{r.stockPurchased} kg</td>
                    <td>{r.stockSold} kg</td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>{r.stockWasted} kg</td>
                    <td><span className="badge badge-yellow">{r.reason}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {wastageRecords.length === 0 && (
          <div className="card mt-4">
            <div className="card-body" style={{ textAlign: 'center', padding: 40 }}>
              <p className="text-muted">{t.noWastageRecordsYetRecordActualWastageToImprovePredictions || 'No wastage records yet. Record actual wastage to improve predictions.'}</p>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{t.recordWastage}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t.date}</label>
                  <input type="date" className="form-input" value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.vegetable || 'Vegetable *'}</label>
                  <select className="form-select" value={form.vegetableName}
                    onChange={e => setForm(p => ({ ...p, vegetableName: e.target.value }))}
                    style={errors.vegetableName ? { borderColor: '#ef4444' } : {}}>
                    <option value="">{t.select || 'Select...'}</option>
                    {vegetables.map(v => <option key={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t.stockPurchased} *</label>
                  <input type="number" className="form-input" value={form.stockPurchased} min="0"
                    onChange={e => setForm(p => ({ ...p, stockPurchased: e.target.value }))}
                    style={errors.stockPurchased ? { borderColor: '#ef4444' } : {}} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.stockSold}</label>
                  <input type="number" className="form-input" value={form.stockSold} min="0"
                    onChange={e => setForm(p => ({ ...p, stockSold: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.stockWasted}</label>
                  <input type="number" className="form-input" value={form.stockWasted} min="0"
                    onChange={e => setForm(p => ({ ...p, stockWasted: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.reason}</label>
                  <select className="form-select" value={form.reason}
                    onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}>
                    {WASTAGE_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button>
              <button className="btn btn-primary" onClick={handleSave}>{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

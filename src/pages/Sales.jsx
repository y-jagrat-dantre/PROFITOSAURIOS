import { useState } from 'react';
import { Plus, Trash2, X, Download, Upload } from 'lucide-react';
import { useApp } from '../hooks/useAppContext';
import { genId, formatINR, toCSV, downloadFile, parseCSV } from '../utils/helpers';

const EMPTY_SALE = {
  date: new Date().toISOString().split('T')[0],
  vegetableName: '',
  vegetableId: '',
  quantity: '',
  sellingPrice: '',
  purchasePrice: '',
};

export default function Sales() {
  const { vegetables, sales, addSale, updateSale, deleteSale, t } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_SALE);
  const [filterDate, setFilterDate] = useState('all');
  const [filterVeg, setFilterVeg] = useState('all');
  const [errors, setErrors] = useState({});

  // Date filter
  const today = new Date().toISOString().split('T')[0];
  const week = new Date(); week.setDate(week.getDate() - 7);
  const month = new Date(); month.setDate(month.getDate() - 30);

  const filtered = sales.filter(s => {
    if (filterVeg !== 'all' && s.vegetableName !== filterVeg) return false;
    if (filterDate === 'today') return s.date === today;
    if (filterDate === 'week') return new Date(s.date) >= week;
    if (filterDate === 'month') return new Date(s.date) >= month;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalRevenue = filtered.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalProfit = filtered.reduce((s, r) => s + (r.profit || 0), 0);

  function openAdd() {
    setForm(EMPTY_SALE);
    setErrors({});
    setShowModal(true);
  }

  function handleVegChange(name) {
    const veg = vegetables.find(v => v.name === name);
    setForm(prev => ({
      ...prev,
      vegetableName: name,
      vegetableId: veg?.id || '',
      sellingPrice: veg?.sellingPrice || '',
      purchasePrice: veg?.purchasePrice || '',
    }));
  }

  function validate() {
    const e = {};
    if (!form.vegetableName) e.vegetableName = 'Required';
    if (!form.quantity || form.quantity <= 0) e.quantity = 'Must be > 0';
    if (!form.sellingPrice || form.sellingPrice <= 0) e.sellingPrice = 'Must be > 0';
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const qty = parseFloat(form.quantity);
    const price = parseFloat(form.sellingPrice);
    const buyPrice = parseFloat(form.purchasePrice) || 0;
    addSale({
      id: genId(),
      date: form.date,
      vegetableId: form.vegetableId,
      vegetableName: form.vegetableName,
      quantity: qty,
      sellingPrice: price,
      purchasePrice: buyPrice,
      revenue: Math.round(qty * price),
      profit: Math.round(qty * (price - buyPrice)),
    });
    setShowModal(false);
  }

  function handleExport() {
    const data = filtered.map(s => ({
      Date: s.date,
      Vegetable: s.vegetableName,
      'Qty (kg)': s.quantity,
      'Sell Price': s.sellingPrice,
      Revenue: s.revenue,
      Profit: s.profit,
    }));
    downloadFile(toCSV(data), `sales-${today}.csv`);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rows = parseCSV(evt.target.result);
      rows.forEach(row => {
        const veg = vegetables.find(v => v.name === row.Vegetable);
        if (!row.Vegetable || !row['Qty (kg)']) return;
        const qty = parseFloat(row['Qty (kg)']) || 0;
        const price = parseFloat(row['Sell Price']) || (veg?.sellingPrice || 0);
        const buyPrice = veg?.purchasePrice || 0;
        addSale({
          id: genId(),
          date: row.Date || today,
          vegetableName: row.Vegetable,
          vegetableId: veg?.id || '',
          quantity: qty,
          sellingPrice: price,
          purchasePrice: buyPrice,
          revenue: Math.round(qty * price),
          profit: Math.round(qty * (price - buyPrice)),
        });
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.salesHistory}</h1>
          <span className="page-subtitle">{filtered.length} {t.records || 'records'}</span>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={13} /> {t.exportCSV}
          </button>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={13} /> {t.importCSV}
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={14} /> {t.addSale}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="stats-grid mb-4">
          {[
            { label: t.totalRevenue, value: formatINR(totalRevenue), color: '#16a34a' },
            { label: t.totalProfit, value: formatINR(totalProfit), color: '#3b82f6' },
            { label: t.records || 'Records', value: filtered.length, color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div className="stat-card" key={label}>
              <div className="stat-card-label">{label}</div>
              <div className="stat-card-value" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 150 }} value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="all">{t.allDates || 'All Dates'}</option>
            <option value="today">{t.today}</option>
            <option value="week">{t.last7Days}</option>
            <option value="month">{t.last30Days}</option>
          </select>
          <select className="form-select" style={{ width: 160 }} value={filterVeg} onChange={e => setFilterVeg(e.target.value)}>
            <option value="all">{t.allVegetables || 'All Vegetables'}</option>
            {[...new Set(sales.map(s => s.vegetableName))].sort().map(n => <option key={n}>{t[n] || n}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 40 }}>
              <p className="text-muted">{t.noSales}</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.date}</th>
                  <th>{t.vegetable || 'Vegetable'}</th>
                  <th>{t.qtyKg || 'Qty (kg)'}</th>
                  <th>{t.sellPrice || 'Sell Price'}</th>
                  <th>{t.revenue}</th>
                  <th>{t.profit || 'Profit'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>{t[s.vegetableName] || s.vegetableName}</td>
                    <td>{s.quantity} {t.unitKg || 'kg'}</td>
                    <td>{formatINR(s.sellingPrice)}/{t.unitKg || 'kg'}</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatINR(s.revenue)}</td>
                    <td style={{ color: '#3b82f6', fontWeight: 600 }}>{formatINR(s.profit)}</td>
                    <td>
                      <button className="btn-icon" onClick={() => deleteSale(s.id)}
                        style={{ background: '#fef2f2', color: '#ef4444', borderColor: '#fecaca' }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{t.addSale}</div>
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
                  <label className="form-label">{t.vegetable || 'Vegetable'} *</label>
                  <select className={`form-select ${errors.vegetableName ? '' : ''}`}
                    value={form.vegetableName}
                    onChange={e => handleVegChange(e.target.value)}
                    style={errors.vegetableName ? { borderColor: '#ef4444' } : {}}>
                    <option value="">{t.selectVegetable || 'Select vegetable...'}</option>
                    {vegetables.map(v => <option key={v.id} value={v.name}>{t[v.name] || v.name}</option>)}
                  </select>
                  {errors.vegetableName && <span style={{ color: '#ef4444', fontSize: 11 }}>{t[errors.vegetableName] || errors.vegetableName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t.quantity} *</label>
                  <input type="number" className="form-input" value={form.quantity} min="0"
                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    style={errors.quantity ? { borderColor: '#ef4444' } : {}} />
                  {errors.quantity && <span style={{ color: '#ef4444', fontSize: 11 }}>{t[errors.quantity] || errors.quantity}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t.sellingPriceKg || 'Selling Price (₹/kg) *'}</label>
                  <input type="number" className="form-input" value={form.sellingPrice} min="0"
                    onChange={e => setForm(p => ({ ...p, sellingPrice: e.target.value }))}
                    style={errors.sellingPrice ? { borderColor: '#ef4444' } : {}} />
                </div>
              </div>
              {form.quantity && form.sellingPrice && (
                <div className="alert alert-success mt-3">
                  {t.revenue || 'Revenue'}: {formatINR(form.quantity * form.sellingPrice)} |
                  {t.profit || 'Profit'}: {formatINR(form.quantity * (parseFloat(form.sellingPrice) - parseFloat(form.purchasePrice || 0)))}
                </div>
              )}
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

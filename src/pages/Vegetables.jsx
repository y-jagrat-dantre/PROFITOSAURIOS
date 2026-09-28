import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { useApp } from '../hooks/useAppContext';
import { genId, formatINR, wastageRiskBadge } from '../utils/helpers';
import { CATEGORIES, SEASONS } from '../data/demoData';

const EMPTY_VEG = {
  name: '', category: 'Vegetable', purchasePrice: '', sellingPrice: '',
  availableQuantity: '', storageCapacity: '', expectedDemand: '',
  minimumStock: '', maximumStock: '', wastageRate: '', season: 'All Season',
  supplier: '', supplierPrice: '', marketPrice: '',
};

export default function Vegetables() {
  const { vegetables, addVegetable, updateVegetable, deleteVegetable, t } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [showModal, setShowModal] = useState(false);
  const [editVeg, setEditVeg] = useState(null);
  const [form, setForm] = useState(EMPTY_VEG);
  const [errors, setErrors] = useState({});

  const filtered = vegetables
    .filter(v => {
      const q = search.toLowerCase();
      return (!q || v.name.toLowerCase().includes(q)) &&
        (filterCat === 'All' || v.category === filterCat);
    })
    .sort((a, b) => {
      if (sortBy === 'profit') return (b.sellingPrice - b.purchasePrice) - (a.sellingPrice - a.purchasePrice);
      if (sortBy === 'demand') return b.expectedDemand - a.expectedDemand;
      if (sortBy === 'stock') return b.availableQuantity - a.availableQuantity;
      if (sortBy === 'wastage') return b.wastageRate - a.wastageRate;
      return a.name.localeCompare(b.name);
    });

  function openAdd() {
    setEditVeg(null);
    setForm(EMPTY_VEG);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(veg) {
    setEditVeg(veg);
    setForm({ ...veg });
    setErrors({});
    setShowModal(true);
  }

    function validate(f) {
    const e = {};
    if (!f.name.trim()) e.name = 'Required';
    if (!f.purchasePrice || f.purchasePrice <= 0) e.purchasePrice = 'Must be > 0';
    if (!f.sellingPrice || f.sellingPrice <= 0) e.sellingPrice = 'Must be > 0';
    if (parseFloat(f.sellingPrice) <= parseFloat(f.purchasePrice)) e.sellingPrice = 'Must be > purchase price';
    if (!f.availableQuantity || f.availableQuantity < 0) e.availableQuantity = 'Must be >= 0';
    if (!f.expectedDemand || f.expectedDemand <= 0) e.expectedDemand = 'Must be > 0';
    return e;
  };

  function handleSave() {
    const data = {
      ...form,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      sellingPrice: parseFloat(form.sellingPrice) || 0,
      availableQuantity: parseFloat(form.availableQuantity) || 0,
      storageCapacity: parseFloat(form.storageCapacity) || 100,
      expectedDemand: parseFloat(form.expectedDemand) || 0,
      minimumStock: parseFloat(form.minimumStock) || 0,
      maximumStock: parseFloat(form.maximumStock) || 999,
      wastageRate: parseFloat(form.wastageRate) || 0,
      supplierPrice: parseFloat(form.supplierPrice) || 0,
      marketPrice: parseFloat(form.marketPrice) || 0,
    };
    const e = validate(data);
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    if (editVeg) {
      updateVegetable(editVeg.id, data);
    } else {
      addVegetable({ ...data, id: genId() });
    }
    setShowModal(false);
  }

  function handleDelete(id) {
    if (window.confirm('Delete this vegetable?')) deleteVegetable(id);
  }

  const f = (field, numeric = false) => ({
    value: form[field],
    onChange: e => setForm(prev => ({ ...prev, [field]: numeric ? e.target.value : e.target.value })),
    className: `form-input ${errors[field] ? 'border-red-500' : ''}`,
    style: errors[field] ? { borderColor: '#ef4444' } : {},
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.vegetables}</h1>
          <span className="page-subtitle">{vegetables.length} items</span>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={14} /> {t.addVegetable}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ minWidth: 200, flex: 1 }}>
            <Search />
            <input className="form-input" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 140 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="form-select" style={{ width: 170 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">{t.sortName || 'Sort: Name'}</option>
            <option value="profit">{t.sortProfit || 'Sort: Profit'}</option>
            <option value="demand">{t.sortDemand || 'Sort: Demand'}</option>
            <option value="stock">{t.sortStock || 'Sort: Stock'}</option>
            <option value="wastage">{t.sortWastage || 'Sort: Wastage'}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
              <p className="text-muted">{t.noVegetables}</p>
              <button className="btn btn-primary mt-4" onClick={openAdd}><Plus size={14} /> {t.addVegetable}</button>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.name || 'Name'}</th>
                  <th>{t.category || 'Category'}</th>
                  <th>{t.buyPrice || 'Buy Price'}</th>
                  <th>{t.sellPrice || 'Sell Price'}</th>
                  <th>{t.profitkg || 'Profit/kg'}</th>
                  <th>{t.stock || 'Stock'}</th>
                  <th>{t.demand || 'Demand'}</th>
                  <th>{t.wastage || 'Wastage'}</th>
                  <th>{t.actions || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(veg => {
                  const profit = veg.sellingPrice - veg.purchasePrice;
                  const wRisk = veg.wastageRate >= 15 ? 'High' : veg.wastageRate >= 8 ? 'Medium' : 'Low';
                  return (
                    <tr key={veg.id}>
                      <td style={{ fontWeight: 600 }}>{veg.name}</td>
                      <td><span className="badge badge-gray">{veg.category}</span></td>
                      <td>{formatINR(veg.purchasePrice)}/kg</td>
                      <td>{formatINR(veg.sellingPrice)}/kg</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatINR(profit)}/kg</td>
                      <td>{veg.availableQuantity} kg</td>
                      <td>{veg.expectedDemand} kg</td>
                      <td><span className={`badge ${wastageRiskBadge(wRisk)}`}>{veg.wastageRate}%</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-icon" onClick={() => openEdit(veg)} title="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button className="btn-icon btn-danger" onClick={() => handleDelete(veg.id)} title="Delete"
                            style={{ background: '#fef2f2', color: '#ef4444', borderColor: '#fecaca' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editVeg ? t.editVegetable : t.addVegetable}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t.vegetableName} *</label>
                  <input {...f('name')} placeholder="e.g. Tomato" />
                  {errors.name && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t.category}</label>
                  <select {...f('category')} className="form-select">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t.purchasePrice} *</label>
                  <input type="number" {...f('purchasePrice', true)} placeholder="25" min="0" />
                  {errors.purchasePrice && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.purchasePrice}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t.sellingPrice} *</label>
                  <input type="number" {...f('sellingPrice', true)} placeholder="40" min="0" />
                  {errors.sellingPrice && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.sellingPrice}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t.availableQty} *</label>
                  <input type="number" {...f('availableQuantity', true)} placeholder="50" min="0" />
                  {errors.availableQuantity && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.availableQuantity}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t.storageCapacity}</label>
                  <input type="number" {...f('storageCapacity', true)} placeholder="100" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.expectedDemand} *</label>
                  <input type="number" {...f('expectedDemand', true)} placeholder="70" min="0" />
                  {errors.expectedDemand && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.expectedDemand}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t.minStock}</label>
                  <input type="number" {...f('minimumStock', true)} placeholder="20" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.maxStock}</label>
                  <input type="number" {...f('maximumStock', true)} placeholder="100" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.wastageRate}</label>
                  <input type="number" {...f('wastageRate', true)} placeholder="5" min="0" max="100" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.season}</label>
                  <select {...f('season')} className="form-select">
                    {SEASONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t.supplier}</label>
                  <input {...f('supplier')} placeholder="Supplier name" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.supplierPrice}</label>
                  <input type="number" {...f('supplierPrice', true)} placeholder="24" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.marketPrice}</label>
                  <input type="number" {...f('marketPrice', true)} placeholder="40" min="0" />
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

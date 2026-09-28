import { useApp } from '../hooks/useAppContext';
import { formatINR, formatKg, formatPct, wastageRiskBadge } from '../utils/helpers';

export default function Inventory() {
  const { vegetables, t } = useApp();

  const totalStock = vegetables.reduce((s, v) => s + v.availableQuantity, 0);
  const totalCapacity = vegetables.reduce((s, v) => s + v.storageCapacity, 0);
  const totalValue = vegetables.reduce((s, v) => s + v.availableQuantity * v.purchasePrice, 0);
  const utilization = totalCapacity > 0 ? (totalStock / totalCapacity) * 100 : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.inventory}</h1>
          <span className="page-subtitle">{t.inventorySubtitle || 'Real-time stock overview'}</span>
        </div>
      </div>
      <div className="page-body">
        <div className="stats-grid mb-6">
          {[
            { label: t.totalStock || 'Total Stock', value: formatKg(totalStock), color: '#16a34a', bg: '#f0fdf4' },
            { label: t.totalCapacity || 'Total Capacity', value: formatKg(totalCapacity), color: '#3b82f6', bg: '#eff6ff' },
            { label: t.inventoryValue || 'Inventory Value', value: formatINR(totalValue), color: '#f59e0b', bg: '#fffbeb' },
            { label: t.utilization || 'Utilization', value: formatPct(utilization), color: '#8b5cf6', bg: '#f5f3ff' },
          ].map(({ label, value, color, bg }) => (
            <div className="stat-card" key={label}>
              <div className="stat-card-label">{label}</div>
              <div className="stat-card-value" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.vegetableName || 'Vegetable'}</th>
                <th>{t.availableQty || 'Available'}</th>
                <th>{t.capacity || 'Capacity'}</th>
                <th>{t.utilization || 'Utilization'}</th>
                <th>{t.value || 'Value'}</th>
                <th>{t.minStock || 'Min Stock'}</th>
                <th>{t.demand || 'Demand'}</th>
                <th>{t.wastageRisk || 'Wastage Risk'}</th>
                <th>{t.status || 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {vegetables.map(veg => {
                const util = veg.storageCapacity > 0 ? (veg.availableQuantity / veg.storageCapacity) * 100 : 0;
                const value = veg.availableQuantity * veg.purchasePrice;
                const wRisk = veg.wastageRate >= 15 ? 'High' : veg.wastageRate >= 8 ? 'Medium' : 'Low';
                let status = 'OK';
                let statusClass = 'badge-green';
                if (veg.availableQuantity < veg.minimumStock) { status = 'Low'; statusClass = 'badge-red'; }
                else if (veg.availableQuantity > veg.expectedDemand * 1.3) { status = 'Overstock'; statusClass = 'badge-yellow'; }
                return (
                  <tr key={veg.id}>
                    <td style={{ fontWeight: 600 }}>{t[veg.name] || veg.name}</td>
                    <td>{veg.availableQuantity} {t.unitKg || 'kg'}</td>
                    <td>{veg.storageCapacity} {t.unitKg || 'kg'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 80 }}>
                          <div className="progress-fill" style={{ width: `${Math.min(util, 100)}%`, background: util > 90 ? '#ef4444' : '#16a34a' }} />
                        </div>
                        <span style={{ fontSize: 11 }}>{util.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>{formatINR(value)}</td>
                    <td>{veg.minimumStock} {t.unitKg || 'kg'}</td>
                    <td>{veg.expectedDemand} {t.unitKg || 'kg'}</td>
                    <td><span className={`badge ${wastageRiskBadge(wRisk)}`}>{veg.wastageRate}%</span></td>
                    <td><span className={`badge ${statusClass}`}>{t[status] || status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useApp } from '../hooks/useAppContext';
import { formatINR, calcTrend } from '../utils/helpers';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function DemandForecast() {
  const { vegetables, sales, t } = useApp();

  // Build per-vegetable trend data
  const vegTrends = vegetables.map(veg => {
    const vegSales = sales
      .filter(s => s.vegetableName === veg.name)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const quantities = vegSales.map(s => s.quantity);
    const trend = calcTrend(quantities);

    // Last 14 days + 7 day forecast
    const days14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.vegetableName === veg.name && s.date === dateStr);
      const qty = daySales.reduce((s, r) => s + r.quantity, 0);
      days14.push({ date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), actual: qty || null, forecast: null });
    }

    // Forecast: last actual or demand + trend
    const lastActual = quantities.length > 0 ? quantities[quantities.length - 1] : veg.expectedDemand;
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const forecasted = Math.max(0, Math.round(lastActual + trend * i));
      days14.push({
        date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        actual: null,
        forecast: forecasted,
      });
    }

    const avg7 = quantities.slice(-7).reduce((s, v) => s + v, 0) / Math.max(1, Math.min(7, quantities.length));
    const trendDir = trend > 0.5 ? '↑ Increasing' : trend < -0.5 ? '↓ Decreasing' : '→ Stable';

    return {
      veg,
      chartData: days14,
      avg7: Math.round(avg7),
      trend,
      trendDir,
      forecasted7d: Math.max(0, Math.round(lastActual + trend * 7)),
    };
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.demandForecast}</h1>
          <span className="page-subtitle">{t.basedOnAvailableSalesData || 'Based on available sales data'}</span>
        </div>
      </div>

      <div className="page-body">
        {vegTrends.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 40 }}>
              <p className="text-muted">{t.addVegetablesAndSalesHistoryToSeeDemandForecasts || 'Add vegetables and sales history to see demand forecasts.'}</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {vegTrends.map(({ veg, chartData, avg7, trendDir, forecasted7d }) => (
              <div className="card" key={veg.id}>
                <div className="card-header">
                  <span className="card-title">{veg.name}</span>
                  <div className="flex gap-2">
                    <span className="badge badge-gray">Avg 7d: {avg7} kg</span>
                    <span className={`badge ${trendDir.startsWith('↑') ? 'badge-green' : trendDir.startsWith('↓') ? 'badge-red' : 'badge-gray'}`}>
                      {trendDir}
                    </span>
                    <span className="badge badge-blue">Forecast: {forecasted7d} kg</span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="flex gap-3 mb-3" style={{ flexWrap: 'wrap' }}>
                    <div>
                      <span className="stat-card-label">{t.expectedDemand || 'Expected Demand'}</span>
                      <div style={{ fontWeight: 700 }}>{veg.expectedDemand} kg/day</div>
                    </div>
                    <div>
                      <span className="stat-card-label">{t['7dayForecast'] || '7-Day Forecast'}</span>
                      <div style={{ fontWeight: 700, color: '#16a34a' }}>{forecasted7d} kg</div>
                    </div>
                    <div>
                      <span className="stat-card-label">{t.estRevenue7d || 'Est. Revenue (7d)'}</span>
                      <div style={{ fontWeight: 700 }}>{formatINR(forecasted7d * veg.sellingPrice)}</div>
                    </div>
                  </div>

                  {chartData.some(d => d.actual !== null || d.forecast !== null) ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                        <YAxis tick={{ fontSize: 10 }} unit=" kg" />
                        <Tooltip formatter={v => [v + ' kg']} />
                        <Legend />
                        <Line type="monotone" dataKey="actual" stroke="#16a34a" strokeWidth={2} dot={false} name="Actual Sales" connectNulls={false} />
                        <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted text-sm" style={{ padding: '20px 0' }}>
                      {t.noSalesDataForThisVegetableYetEnterSalesHistoryToSeeTrends || 'No sales data for this vegetable yet. Enter sales history to see trends.'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

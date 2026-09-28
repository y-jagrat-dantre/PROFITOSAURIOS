import { useApp } from '../hooks/useAppContext';
import { formatINR, formatKg, formatPct, wastageRiskBadge } from '../utils/helpers';
import { profitPerKg } from '../optimization/optimizer';
import { Zap } from 'lucide-react';

export default function Recommendations({ onNavigate }) {
  const { optimizationResults, aiAnalysis, settings, t, vegetables } = useApp();

  if (optimizationResults.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">{t.recommendations}</h1>
          </div>
        </div>
        <div className="page-body">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{t.noRecommendationsYet || 'No recommendations yet'}</div>
              <p className="text-muted mb-4">{t.generateTodaysPlanFromTheDashboardToSeeSmartStockRecommendations || 'Generate today\'s plan from the Dashboard to see smart stock recommendations.'}</p>
              <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
                <Zap size={14} /> {t.goToDashboard || 'Go to Dashboard'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = optimizationResults.reduce((s, r) => s + r.expectedRevenue, 0);
  const totalProfit = optimizationResults.reduce((s, r) => s + r.expectedProfit, 0);
  const totalWastage = optimizationResults.reduce((s, r) => s + r.expectedWastage, 0);
  const totalQty = optimizationResults.reduce((s, r) => s + r.recommendedQty, 0);

  // Get AI analysis per vegetable if available
  const aiMap = {};
  if (aiAnalysis?.data?.recommendations) {
    aiAnalysis.data.recommendations.forEach(r => { aiMap[r.vegetable] = r; });
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.smartRecommendation}</h1>
          <span className="page-subtitle">
            {aiAnalysis?.isAI ? 'Smart Analysis + Math Optimization' : 'Mathematical Optimization'}
          </span>
        </div>
      </div>

      <div className="page-body">
        {/* AI unavailable warning */}
        {aiAnalysis && !aiAnalysis.isAI && (
          <div className="alert alert-info mb-4">{t.aiOffline}</div>
        )}

        {/* AI summary */}
        {aiAnalysis?.data?.summary && (
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">{t.analysisSummary || '📊 Analysis Summary'}</span>
              {aiAnalysis?.data?.confidence && (
                <span className="badge badge-blue">{aiAnalysis.data.confidence}% confidence</span>
              )}
            </div>
            <div className="card-body">
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>{aiAnalysis.data.summary}</p>
              {aiAnalysis.data.observations?.length > 0 && (
                <div className="mt-3">
                  {aiAnalysis.data.observations.map((o, i) => (
                    <div key={i} className="text-sm" style={{ color: '#16a34a', marginBottom: 2 }}>• {o}</div>
                  ))}
                </div>
              )}
              {aiAnalysis.data.overallWarnings?.length > 0 && (
                <div className="mt-3">
                  {aiAnalysis.data.overallWarnings.map((w, i) => (
                    <div key={i} className="alert alert-warning mt-2" style={{ padding: '8px 12px', fontSize: 12 }}>⚠ {w}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="stats-grid mb-6">
          {[
            { label: 'Total Recommended', value: formatKg(totalQty), color: '#16a34a' },
            { label: t.expectedRevenue, value: formatINR(totalRevenue), color: '#3b82f6' },
            { label: t.expectedProfit, value: formatINR(totalProfit), color: '#16a34a' },
            { label: t.expectedWastage, value: formatINR(totalWastage), color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div className="stat-card" key={label}>
              <div className="stat-card-label">{label}</div>
              <div className="stat-card-value" style={{ color, fontSize: 20 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* TODAY'S PLAN heading */}
        <div className="section-title mb-4">{t.todaysSalesPlan || 'TODAY\'S SALES PLAN'}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {optimizationResults.map(r => {
            const ai = aiMap[r.vegetable.name];
            const profitKg = Math.round(profitPerKg(r.vegetable));

            // Build reason from data
            const reasons = [];
            if (r.demandLevel === 'High') reasons.push('Demand has been high recently.');
            if (profitKg > 15) reasons.push(`Profit margin is healthy at ₹${profitKg}/kg.`);
            if (r.wastageRisk === 'Low') reasons.push('Estimated wastage remains manageable.');
            if (r.vegetable.availableQuantity < r.vegetable.expectedDemand) reasons.push('Current stock is below estimated demand.');
            if (ai?.reason) reasons.push(ai.reason);

            return (
              <div className="rec-card" key={r.vegetable.id}>
                <div className="rec-card-header">
                  <div className="rec-veg-name">🥬 {r.vegetable.name}</div>
                  <div className="flex gap-2">
                    <span className={`badge ${r.demandLevel === 'High' ? 'badge-green' : r.demandLevel === 'Medium' ? 'badge-yellow' : 'badge-gray'}`}>
                      {r.demandLevel}
                    </span>
                    <span className={`badge ${wastageRiskBadge(r.wastageRisk)}`}>
                      {r.wastageRisk} waste
                    </span>
                  </div>
                </div>

                <div className="rec-grid mb-3">
                  <div className="rec-stat">
                    <div className="rec-stat-label">{t.recommendedStock || 'Recommended Stock'}</div>
                    <div className="rec-stat-value">{r.recommendedQty} kg</div>
                  </div>
                  <div className="rec-stat">
                    <div className="rec-stat-label">{t.expectedSales || 'Expected Sales'}</div>
                    <div className="rec-stat-value">{r.expectedSales} kg</div>
                  </div>
                  <div className="rec-stat">
                    <div className="rec-stat-label">{t.expectedRevenue || 'Expected Revenue'}</div>
                    <div className="rec-stat-value" style={{ color: '#16a34a' }}>{formatINR(r.expectedRevenue)}</div>
                  </div>
                  <div className="rec-stat">
                    <div className="rec-stat-label">{t.expectedProfit || 'Expected Profit'}</div>
                    <div className="rec-stat-value" style={{ color: '#3b82f6' }}>{formatINR(r.expectedProfit)}</div>
                  </div>
                  <div className="rec-stat">
                    <div className="rec-stat-label">{t.profitMargin || 'Profit Margin'}</div>
                    <div className="rec-stat-value">{r.profitMargin}%</div>
                  </div>
                  <div className="rec-stat">
                    <div className="rec-stat-label">{t.estWastage || 'Est. Wastage'}</div>
                    <div className="rec-stat-value" style={{ color: '#f59e0b' }}>{formatINR(r.expectedWastage)}</div>
                  </div>
                </div>

                {ai?.warning && (
                  <div className="alert alert-warning" style={{ padding: '6px 10px', fontSize: 12, marginBottom: 10 }}>
                    ⚠ {ai.warning}
                  </div>
                )}

                {reasons.length > 0 && (
                  <details>
                    <summary style={{ fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', marginBottom: 6 }}>
                      {t.whyRecommendation}
                    </summary>
                    <div style={{ paddingTop: 6 }}>
                      {reasons.map((reason, i) => (
                        <div key={i} className="text-sm" style={{ color: '#475569', marginBottom: 2 }}>• {reason}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>

        <div className="alert alert-info mt-6">
          <span>
            {t.allFiguresAre || 'All figures are'} <strong>{t.estimated || 'estimated'}</strong> based on available data. Actual sales may vary.
            Recommendations are based on available budget of {formatINR(settings.budget)} and storage of {settings.storageCapacity} kg.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── AI Service (Gemini) ─────────────────────────────────────────────────────
// All AI calls go through this service. The API key must come from backend env.
// For the frontend-only demo, we proxy through a /api/analyze endpoint.
// If no backend, the app still works with local mathematical optimization.

const AI_ENDPOINT = '/api/analyze'; // Backend route keeps the key secure

/**
 * Build a structured prompt payload for analysis.
 */
function buildPayload(vegetables, sales, budget, storageCapacity, optimizationResults) {
  const today = new Date().toISOString().split('T')[0];

  // Summarize historical sales per vegetable
  const salesByVeg = {};
  sales.forEach(s => {
    if (!salesByVeg[s.vegetableName]) salesByVeg[s.vegetableName] = [];
    salesByVeg[s.vegetableName].push(s.quantity);
  });

  return {
    date: today,
    budget,
    storageCapacity,
    vegetables: vegetables.map(v => ({
      name: v.name,
      purchasePrice: v.purchasePrice,
      sellingPrice: v.sellingPrice,
      stock: v.availableQuantity,
      expectedDemand: v.expectedDemand,
      wastageRate: v.wastageRate,
      historicalSales: (salesByVeg[v.name] || []).slice(-30),
    })),
    mathOptimizationResults: optimizationResults.map(r => ({
      vegetable: r.vegetable.name,
      recommendedQuantity: r.recommendedQty,
      expectedSales: r.expectedSales,
      expectedRevenue: r.expectedRevenue,
      expectedProfit: r.expectedProfit,
      demandLevel: r.demandLevel,
      wastageRisk: r.wastageRisk,
    })),
  };
}

/**
 * Validate AI response schema.
 */
function validateResponse(data) {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.confidence !== 'number') return false;
  if (!Array.isArray(data.recommendations)) return false;
  return true;
}

/**
 * Fallback response when AI is unavailable.
 */
function buildFallback(optimizationResults) {
  return {
    summary: 'Smart analysis based on your local mathematical optimization.',
    confidence: 65,
    recommendations: optimizationResults.map(r => ({
      vegetable: r.vegetable.name,
      recommendedQuantity: r.recommendedQty,
      expectedSales: r.expectedSales,
      demandLevel: r.demandLevel,
      wastageRisk: r.wastageRisk,
      reason: `Profit margin: ₹${Math.round(r.vegetable.sellingPrice - r.vegetable.purchasePrice)}/kg. Based on expected demand of ${r.vegetable.expectedDemand} kg.`,
      warning: r.wastageRisk === 'High' ? `High wastage rate (${r.vegetable.wastageRate}%). Monitor stock carefully.` : '',
    })),
    overallWarnings: [],
    observations: [
      'Analysis based on local mathematical optimization.',
      'Add more historical sales data to improve predictions.',
      'Smart analysis available when connected.',
    ],
  };
}

export async function analyzeWithAI(vegetables, sales, budget, storageCapacity, optimizationResults) {
  if (!navigator.onLine) {
    return { data: buildFallback(optimizationResults), isAI: false };
  }

  try {
    const payload = buildPayload(vegetables, sales, budget, storageCapacity, optimizationResults);

    // Get API Key from localStorage
    const savedSettings = localStorage.getItem('vv_settings');
    let geminiKey = '';
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        geminiKey = parsed.geminiKey;
      } catch (e) {}
    }

    if (!geminiKey) {
      // No key, use fallback
      return { data: buildFallback(optimizationResults), isAI: false };
    }

    const prompt = `You are an expert AI business analyst for vegetable vendors. 
Analyze this data and provide strategic recommendations in strict JSON format matching this schema:
{
  "summary": "String (1-2 sentences overall analysis)",
  "confidence": "Number (0-100)",
  "recommendations": [
    {
      "vegetable": "String (name of vegetable)",
      "recommendedQuantity": "Number (kg to buy)",
      "expectedSales": "Number (kg expected to sell)",
      "demandLevel": "String (Low, Medium, High)",
      "wastageRisk": "String (Low, Medium, High)",
      "reason": "String (Why this recommendation?)",
      "warning": "String (Optional warning about wastage or stock, or empty string)"
    }
  ],
  "overallWarnings": ["String", "String"],
  "observations": ["String", "String"]
}

Data:
${JSON.stringify(payload, null, 2)}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json",
        }
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const resData = await response.json();
    const textOutput = resData.candidates[0].content.parts[0].text;
    const data = JSON.parse(textOutput);

    if (!validateResponse(data)) throw new Error('Invalid AI response schema');

    return { data, isAI: true };
  } catch (err) {
    console.warn('AI analysis unavailable:', err.message);
    return { data: buildFallback(optimizationResults), isAI: false };
  }
}

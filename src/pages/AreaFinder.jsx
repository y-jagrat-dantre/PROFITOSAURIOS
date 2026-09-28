import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Star, Clock, Users, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../hooks/useAppContext';

/* ─── Local Area Suggestions ──────────────────────────────────────────── */

const AREA_SUGGESTIONS = [
  {
    name: 'Railway Station Area',
    emoji: '🚉',
    distance: null,
    footfall: 'Very High',
    bestTime: '7 AM – 10 AM',
    bestItems: ['Banana', 'Apple', 'Lemon', 'Coriander'],
    avgDailySale: 3500,
    competition: 'High',
    tip: 'Commuters buy fruits and small items. Set up near the exit gate.',
    rating: 4.5,
  },
  {
    name: 'Housing Society Gate',
    emoji: '🏘️',
    distance: null,
    footfall: 'High',
    bestTime: '8 AM – 12 PM',
    bestItems: ['Tomato', 'Onion', 'Potato', 'Green Chili', 'Coriander'],
    avgDailySale: 4200,
    competition: 'Medium',
    tip: 'Housewives come out to buy daily veggies in the morning. Fresh stock wins!',
    rating: 4.8,
  },
  {
    name: 'Market Road / Bazaar',
    emoji: '🏪',
    distance: null,
    footfall: 'Very High',
    bestTime: '9 AM – 1 PM, 5 PM – 8 PM',
    bestItems: ['All Vegetables', 'All Fruits'],
    avgDailySale: 6000,
    competition: 'Very High',
    tip: 'High sales but lots of competition. Keep prices ₹2–5 lower than others.',
    rating: 3.8,
  },
  {
    name: 'School / College Area',
    emoji: '🏫',
    distance: null,
    footfall: 'Medium',
    bestTime: '2 PM – 4 PM',
    bestItems: ['Banana', 'Apple', 'Grapes', 'Guava', 'Orange'],
    avgDailySale: 2000,
    competition: 'Low',
    tip: 'Students and parents buy fruits. Keep small portions and cut fruit ready.',
    rating: 4.2,
  },
  {
    name: 'Office Area / IT Park',
    emoji: '🏢',
    distance: null,
    footfall: 'Medium',
    bestTime: '12 PM – 2 PM',
    bestItems: ['Apple', 'Banana', 'Pomegranate', 'Grapes'],
    avgDailySale: 2500,
    competition: 'Low',
    tip: 'Office workers buy premium fruits at lunch. Price can be 10-20% higher.',
    rating: 4.0,
  },
  {
    name: 'Temple / Religious Place',
    emoji: '🛕',
    distance: null,
    footfall: 'High',
    bestTime: '6 AM – 9 AM',
    bestItems: ['Banana', 'Coconut', 'Lemon', 'Coriander', 'Flowers'],
    avgDailySale: 2800,
    competition: 'Medium',
    tip: 'Devotees buy fruits for offerings. Banana and coconut sell the fastest.',
    rating: 4.3,
  },
  {
    name: 'Hospital Area',
    emoji: '🏥',
    distance: null,
    footfall: 'High',
    bestTime: '10 AM – 6 PM',
    bestItems: ['Apple', 'Pomegranate', 'Orange', 'Banana', 'Grapes'],
    avgDailySale: 3000,
    competition: 'Medium',
    tip: 'Visitors buy fruits for patients. Sell in gift baskets for 30% more profit!',
    rating: 4.6,
  },
  {
    name: 'Bus Stand / Auto Stand',
    emoji: '🚌',
    distance: null,
    footfall: 'High',
    bestTime: '7 AM – 11 AM, 4 PM – 7 PM',
    bestItems: ['Banana', 'Guava', 'Seasonal fruits'],
    avgDailySale: 2200,
    competition: 'Medium',
    tip: 'Travelers buy quick snacks. Keep bananas and seasonal fruits visible.',
    rating: 3.9,
  },
];

const FootfallBadge = ({ level }) => {
  const colors = {
    'Very High': '#7c3aed',
    'High': '#16a34a',
    'Medium': '#f59e0b',
    'Low': '#94a3b8',
  };
  return (
    <span style={{
      background: (colors[level] || '#94a3b8') + '18',
      color: colors[level] || '#94a3b8',
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    }}>
      {level}
    </span>
  );
};

const CompetitionBadge = ({ level }) => {
  const colors = {
    'Very High': '#ef4444',
    'High': '#f59e0b',
    'Medium': '#3b82f6',
    'Low': '#22c55e',
  };
  return (
    <span style={{
      background: (colors[level] || '#94a3b8') + '18',
      color: colors[level] || '#94a3b8',
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    }}>
      {level}
    </span>
  );
};

// Calculate distance between two lat/lng points in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function AreaFinder() {
  const { t } = useApp();
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const [sortBy, setSortBy] = useState('rating');
  const [dynamicAreas, setDynamicAreas] = useState(AREA_SUGGESTIONS);

  const fetchRealPlaces = async (lat, lng) => {
    try {
      // 1. Get City/Neighborhood Name from GPS
      const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const revData = await revRes.json();
      const city = revData.address.city || revData.address.town || revData.address.village || revData.address.county || 'your area';
      const suburb = revData.address.suburb || revData.address.neighbourhood;
      
      setLocationName(suburb ? `${suburb}, ${city}` : city);

      // 2. Fetch real local POIs based on the city
      const queries = [
        { type: 'market', q: `market in ${city}` },
        { type: 'hospital', q: `hospital in ${city}` },
        { type: 'station', q: `station in ${city}` },
        { type: 'college', q: `college in ${city}` },
      ];

      const fetchQuery = async (q) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            return {
              name: data[0].name?.split(',')[0] || null,
              lat: parseFloat(data[0].lat),
              lon: parseFloat(data[0].lon)
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      };

      const results = await Promise.all(queries.map(q => fetchQuery(q.q)));
      const [marketPlace, hospitalPlace, stationPlace, collegePlace] = results;

      // 3. Update our suggestions with REAL local names and distances
      setDynamicAreas(prev => prev.map(area => {
        let updatedArea = { ...area };
        
        const applyPlace = (place, nameFormat, tipFormat) => {
          if (place && place.name) {
            updatedArea.name = nameFormat(place.name);
            updatedArea.tip = tipFormat(place.name);
            updatedArea.distance = calculateDistance(lat, lng, place.lat, place.lon);
            updatedArea.lat = place.lat;
            updatedArea.lon = place.lon;
          }
        };

        if (area.name.includes('Market')) {
          applyPlace(marketPlace, n => `${n} Area`, n => `High sales but lots of competition at ${n}. Keep prices ₹2–5 lower.`);
        } else if (area.name.includes('Hospital')) {
          applyPlace(hospitalPlace, n => `${n} Gates`, n => `Visitors buy fruits for patients at ${n}. Sell in gift baskets for 30% more profit!`);
        } else if (area.name.includes('Station')) {
          applyPlace(stationPlace, n => `${n} Outside`, n => `Commuters buy fruits and small items outside ${n}.`);
        } else if (area.name.includes('College')) {
          applyPlace(collegePlace, n => `Near ${n}`, n => `Students at ${n} buy fruits. Keep small portions ready.`);
        } else if (area.name.includes('Housing') && suburb) {
          updatedArea.name = `${suburb} Residential Area`;
          updatedArea.distance = calculateDistance(lat, lng, lat + 0.01, lng + 0.01); // Estimate for local suburb
        }
        return updatedArea;
      }));

    } catch (e) {
      console.error("Failed to fetch real places", e);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        setLocationStatus('success');
        await fetchRealPlaces(lat, lng);
      },
      () => {
        setLocationStatus('error');
      }
    );
  };

  // Auto-get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const sortedAreas = [...dynamicAreas].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'distance') {
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    }
    if (sortBy === 'sales') return b.avgDailySale - a.avgDailySale;
    if (sortBy === 'competition') {
      const order = { 'Low': 0, 'Medium': 1, 'High': 2, 'Very High': 3 };
      return (order[a.competition] ?? 2) - (order[b.competition] ?? 2);
    }
    return 0;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t.bestSellingAreasNearYou || '📍 Best Selling Areas Near You'}</h1>
          <span className="page-subtitle">
            {t.findTheBestSpotsNearbyWhereYouCanSetUpYourStallAndSellMore || 'Find the best spots nearby where you can set up your stall and sell more.'}
          </span>
        </div>
      </div>

      <div className="page-body">
        {/* Location Status */}
        <div className="card mb-6">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: locationStatus === 'success' ? '#dcfce7' : locationStatus === 'loading' ? '#dbeafe' : '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {locationStatus === 'loading' ? (
                <RefreshCw size={22} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
              ) : locationStatus === 'success' ? (
                <Navigation size={22} color="#16a34a" />
              ) : (
                <AlertTriangle size={22} color="#ef4444" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              {locationStatus === 'success' && (
                <>
                  <div style={{ fontWeight: 700, color: '#16a34a' }}>📍 Location: {locationName || 'Detected'}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Showing real local selling areas near you in {locationName}!
                  </div>
                </>
              )}
              {locationStatus === 'loading' && (
                <div style={{ fontWeight: 600 }}>{t.gettingYourLocation || 'Getting your location...'}</div>
              )}
              {locationStatus === 'error' && (
                <>
                  <div style={{ fontWeight: 700, color: '#ef4444' }}>{t.couldNotGetLocation || 'Could not get location'}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {t.pleaseAllowLocationAccessOrTryAgainShowingGeneralAreaSuggestionsBelow || 'Please allow location access or try again. Showing general area suggestions below.'}
                  </div>
                </>
              )}
              {locationStatus === 'idle' && (
                <div style={{ fontWeight: 600 }}>{t.clickTheButtonToDetectYourLocation || 'Click the button to detect your location'}</div>
              )}
            </div>
            <button className="btn btn-primary" onClick={getLocation} style={{ whiteSpace: 'nowrap' }}>
              <MapPin size={16} /> {locationStatus === 'success' ? 'Refresh Location' : 'Get My Location'}
            </button>
          </div>
        </div>

        {/* Sort Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#64748b', alignSelf: 'center', marginRight: 8 }}>{t.sortBy || 'Sort by:'}</span>
          {[
            { key: 'rating', label: '⭐ Best Rated' },
            { key: 'distance', label: '📍 Nearest' },
            { key: 'sales', label: '💰 Highest Sales' },
            { key: 'competition', label: '🏆 Least Competition' },
          ].map(s => (
            <button
              key={s.key}
              className={`btn ${sortBy === s.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSortBy(s.key)}
              style={{ fontSize: 13 }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Area Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {sortedAreas.map((area, i) => (
            <div key={area.name} className="card" style={{ overflow: 'hidden' }}>
              {/* Card Header */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b, #334155)',
                padding: '20px 24px',
                color: '#fff',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{area.emoji}</div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{area.name}</div>
                    {area.distance != null && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                        <Navigation size={12} /> {area.distance.toFixed(1)} km away
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: 'rgba(250,204,21,0.2)', borderRadius: 10, padding: '6px 12px',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Star size={14} color="#facc15" fill="#facc15" />
                    <span style={{ fontWeight: 800, color: '#facc15', fontSize: 15 }}>{area.rating}</span>
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ padding: '16px 20px' }}>
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{t.footfall || 'Footfall'}</div>
                    <FootfallBadge level={area.footfall} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{t.competition || 'Competition'}</div>
                    <CompetitionBadge level={area.competition} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{t.bestTime || 'Best Time'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                      <Clock size={12} color="#64748b" /> {area.bestTime}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{t.avgDailySale || 'Avg. Daily Sale'}</div>
                    <div style={{ fontWeight: 800, color: '#16a34a', fontSize: 16 }}>
                      ₹{area.avgDailySale.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Best Items */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{t.sellTheseItemsHere || 'Sell These Items Here'}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {area.bestItems.map(item => (
                      <span key={item} style={{
                        background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
                        padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tip */}
                <div style={{
                  background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13, color: '#92400e',
                }}>
                  <strong>{t.tip || '💡 Tip:'}</strong> {area.tip}
                </div>

                {/* Google Maps Link */}
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area.name + (locationName ? ', ' + locationName : ''))}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline-glass" 
                  style={{ 
                    width: '100%', marginTop: 16, display: 'flex', justifyContent: 'center', 
                    alignItems: 'center', gap: 8, background: '#e0f2fe', color: '#0369a1',
                    border: '1px solid #bae6fd'
                  }}
                >
                  <MapPin size={16} /> {t.openInGoogleMaps || 'Open in Google Maps'}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="alert alert-warning mt-6" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>{t.note || 'Note:'}</strong> {t.theseAreSuggestedAreasBasedOnTypicalIndianTownPatternsActualSalesDependOnYourLocalAreaWeatherAndCompetitionAlwaysCheckLocalRulesBeforeSettingUpAStall || 'These are suggested areas based on typical Indian town patterns. Actual sales depend on your local area, weather, and competition. Always check local rules before setting up a stall.'}
          </div>
        </div>
      </div>
    </div>
  );
}

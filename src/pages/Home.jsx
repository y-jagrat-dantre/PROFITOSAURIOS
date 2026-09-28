import { useRef, useEffect, useState } from 'react';
import { ArrowRight, Leaf, TrendingUp, Zap, ShieldCheck, BarChart2, Brain, BellRing, Settings, Calculator, Store } from 'lucide-react';
import { useApp } from '../hooks/useAppContext';
import '../index.css';

export default function Home({ onNavigate }) {
  const { t } = useApp();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);

  // Refs for direct DOM mutation to bypass React render lag
  const s1Ref = useRef(null);
  const s2Ref = useRef(null);
  const s3Ref = useRef(null);
  const s4Ref = useRef(null);
  const s5Ref = useRef(null);

  // Track overall scroll progress over our tall container
  useEffect(() => {
    let rafId = null;
    const frameCount = 241;

    // Preload images
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}video-frames/frame_${i.toString().padStart(4, '0')}.jpg`;
      // Force decoding off the main thread so it doesn't freeze scrolling!
      img.decode().catch(() => {});
      imagesRef.current.push(img);
    }

    const drawImage = (img) => {
      const canvas = canvasRef.current;
      if (!canvas || !img || !img.complete || img.width === 0) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      // Update canvas size to match window
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      // Object-fit: cover equivalent math
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      } else {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // Draw first frame when it loads
    imagesRef.current[0].onload = () => {
      drawImage(imagesRef.current[0]);
    };

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const { top, height } = containerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        const maxScroll = height - windowHeight;
        let p = 0;
        if (maxScroll > 0) {
          p = -top / maxScroll;
        }
        p = Math.max(0, Math.min(1, p));

        // Directly mutate DOM to bypass React render cycle!
        const updateStyle = (ref, start, end, isFirst, isLast) => {
          if (!ref.current) return;
          const range = end - start;
          const localProgress = (p - start) / range;

          let opacity = 0;
          let translateY = 80;
          let scale = 0.95;

          if (localProgress >= 0 && localProgress <= 1) {
            if (localProgress < 0.20) {
              if (isFirst) { opacity = 1; translateY = 0; scale = 1; }
              else {
                const lp = localProgress / 0.20;
                opacity = lp; translateY = 80 * (1 - lp); scale = 0.95 + (0.05 * lp);
              }
            } else if (localProgress > 0.80) {
              if (isLast) { opacity = 1; translateY = 0; scale = 1; }
              else {
                const lp = (1 - localProgress) / 0.20;
                opacity = lp; translateY = -80 * (1 - lp); scale = 1 + (0.05 * (1 - lp));
              }
            } else {
              opacity = 1; translateY = 0; scale = 1;
            }
          }

          const el = ref.current;
          el.style.opacity = opacity;
          el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
          el.style.transform = `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`;
        };

        updateStyle(s1Ref, 0, 0.18, true, false);
        updateStyle(s2Ref, 0.22, 0.38, false, false);
        updateStyle(s3Ref, 0.42, 0.58, false, false);
        updateStyle(s4Ref, 0.62, 0.76, false, false);
        updateStyle(s5Ref, 0.78, 1.0, false, true);

        // Draw canvas frame instantly
        const frameIndex = Math.min(frameCount - 1, Math.floor(p * frameCount));
        let targetImg = imagesRef.current[frameIndex];
        
        // If the exact frame hasn't finished downloading yet (causes lag/freeze on GitHub pages)
        // Find the absolute closest frame that IS loaded and use that instead!
        if (!targetImg || !targetImg.complete) {
          let offset = 1;
          while (offset < 50) { // Search up to 50 frames away
            let back = imagesRef.current[frameIndex - offset];
            if (back && back.complete) { targetImg = back; break; }
            let fwd = imagesRef.current[frameIndex + offset];
            if (fwd && fwd.complete) { targetImg = fwd; break; }
            offset++;
          }
        }
        
        if (targetImg) drawImage(targetImg);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Base style for sections (no JS-fighting transitions)
  const baseStyle = {
    position: 'absolute',
    width: '90%',
    maxWidth: '1100px',
    left: '50%',
    top: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    opacity: 0, // Starts invisible, JS takes over instantly
    transform: 'translate(-50%, calc(-50% + 80px)) scale(0.95)',
    transition: 'none' // CRITICAL: Stop CSS from fighting JS requestAnimationFrame!
  };

  return (
    <div className="home-container" style={{ minHeight: '800vh' }} ref={containerRef}>

      {/* Foreground Content locked in fixed view */}
      <div className="sticky-content-layer" style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        
        {/* Fixed Background Canvas replacing Video for zero lag - MOVED HERE FOR BLUR */}
        <div className="video-background-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
          <canvas
            ref={canvasRef}
            className="scroll-video"
            style={{ width: '100%', height: '100%', display: 'block', backgroundColor: '#000', filter: 'brightness(1.35) contrast(1.1) saturate(1.2)' }}
          />
          <div className="video-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.2) 100%)' }} />
        </div>

        {/* Section 1: Hero (Progress 0 to 0.18) */}
        <div ref={s1Ref} style={baseStyle}>
          <section className="hero-section glass-hero" style={{ padding: '60px 40px', width: '100%' }}>
            <div className="hero-content">
              <div className="badge-pill light-pill">
                <span className="badge-pill-pulse"></span>
                PROFITOSAURIOS v2.0
              </div>
              <h1 className="hero-title text-white" style={{ fontSize: 48 }}>
                <span className="text-gradient-bright">{t.heroTitle1 || "Procurement"}</span> {t.heroTitle2 || "& Profit Optimization"}
              </h1>
              <p className="hero-subtitle text-white-70" style={{ fontSize: 22 }}>
                {t.heroSubtitle || "Reduce losses and maximize profits with our Linear Programming (LPP) engine."}
              </p>
              <div className="hero-actions">
                <button className="btn-glow" onClick={() => onNavigate('lppEngine')}>
                  {t.openLppEngine || "Open LPP Engine"} <ArrowRight size={18} />
                </button>
                <button className="btn-outline-glass" onClick={() => onNavigate('vegetables')}>
                  {t.checkMyStock || "Check My Stock"}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Section 2: Features Grid (Progress 0.18 to 0.38) */}
        <div ref={s2Ref} style={baseStyle}>
          <div className="section-heading text-white" style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 42, marginBottom: 16 }}>{t.whyUseApp || "Why Use This App?"}</h2>
            <p className="text-white-70" style={{ fontSize: 18 }}>{t.whyUseAppDesc || "Everything you need to run your vegetable stand easily and make more money."}</p>
          </div>

          <div className="features-grid">
            <div className="feature-card glass-hero">
              <div className="feature-icon icon-green"><Calculator size={24} /></div>
              <h3 className="text-white">{t.lppOpt || "LPP Optimization"}</h3>
              <p className="text-white-70">{t.lppOptDesc || "Calculates the mathematically perfect purchase quantity based on your real business constraints."}</p>
            </div>
            <div className="feature-card glass-hero">
              <div className="feature-icon icon-blue"><Store size={24} /></div>
              <h3 className="text-white">{t.smartComp || "Smart Comparison"}</h3>
              <p className="text-white-70">{t.smartCompDesc || "Compare wholesalers based on your exact recommended quantity, not just cheapest price."}</p>
            </div>
            <div className="feature-card glass-hero">
              <div className="feature-icon icon-purple"><Zap size={24} /></div>
              <h3 className="text-white">{t.bestPrice || "Best Selling Price"}</h3>
              <p className="text-white-70">{t.bestPriceDesc || "Get simple advice on the best price to set so you sell everything quickly and earn more."}</p>
            </div>
            <div className="feature-card glass-hero">
              <div className="feature-icon icon-orange"><ShieldCheck size={24} /></div>
              <h3 className="text-white">{t.stopWaste || "Stop Throwing Veggies"}</h3>
              <p className="text-white-70">{t.stopWasteDesc || "Save your hard-earned money. Stop throwing away unsold, rotten vegetables at the end of the day."}</p>
            </div>
          </div>
        </div>

        {/* Section 3: AI Intelligence (Progress 0.38 to 0.58) */}
        <div ref={s3Ref} style={baseStyle}>
          <section className="glass-hero" style={{ padding: '60px 40px', width: '100%', borderRadius: 24, textAlign: 'center' }}>
            <div className="mb-6 flex justify-center">
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: 16, borderRadius: '50%', display: 'inline-block' }}>
                <Brain size={48} color="#60a5fa" />
              </div>
            </div>
            <h2 className="text-white mb-4" style={{ fontSize: 36 }}>{t.smartHelper || "Your Very Own Smart Helper"}</h2>
            <p className="text-white-70 mb-8" style={{ fontSize: 20, maxWidth: 700, margin: '0 auto' }}>
              {t.smartHelperDesc || "We look at the weather, local festivals, and what your customers want, and give you a simple list of exactly what you should buy from the mandi (market) tomorrow."}
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button className="btn-outline-glass" onClick={() => onNavigate('demandForecast')}>
                {t.seeNeeds || "See Tomorrow's Needs"} <TrendingUp size={16} />
              </button>
              <button className="btn-outline-glass" onClick={() => onNavigate('recommendations')}>
                {t.getAdvice || "Get Smart Advice"} <Brain size={16} />
              </button>
            </div>
          </section>
        </div>

        {/* Section 4: Data-Driven Profits (Progress 0.58 to 0.78) */}
        <div ref={s4Ref} style={baseStyle}>
          <div className="features-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="glass-hero" style={{ padding: 40, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <BarChart2 size={32} color="#4ade80" className="mb-4" />
              <h3 className="text-white text-2xl mb-2">{t.trackRupee || "Track Every Rupee"}</h3>
              <p className="text-white-70 mb-6">{t.trackRupeeDesc || "Simple screens that show you exactly how much money you made today, and where you might be losing money."}</p>
              <button className="btn-glow" onClick={() => onNavigate('reports')} style={{ marginTop: 'auto' }}>
                {t.seeEarnings || "See My Earnings"} <ArrowRight size={16} />
              </button>
            </div>
            <div className="glass-hero" style={{ padding: 40, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <BellRing size={32} color="#f59e0b" className="mb-4" />
              <h3 className="text-white text-2xl mb-2">{t.helpfulAlerts || "Helpful Alerts"}</h3>
              <p className="text-white-70 mb-6">{t.helpfulAlertsDesc || "Get a quick message on your phone when you need to lower the price to sell fast, or when you are about to run out of tomatoes!"}</p>
              <button className="btn-outline-glass" onClick={() => onNavigate('wastage')} style={{ marginTop: 'auto' }}>
                {t.stopWaste || "Stop Throwing Veggies"} <Zap size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Interactive CTA (Progress 0.78 to 1.0) */}
        <div ref={s5Ref} style={baseStyle}>
          <section className="cta-section" style={{ width: '100%' }}>
            <div className="glass-hero" style={{ padding: '40px 40px', borderRadius: 32, textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <img 
                  src="/logo.png" 
                  alt="PROFITOSAURIOS Logo" 
                  style={{ 
                    width: '140px', 
                    height: '140px', 
                    objectFit: 'contain', 
                    filter: 'drop-shadow(0px 12px 24px rgba(0,0,0,0.6))',
                    animation: 'float 6s ease-in-out infinite'
                  }} 
                />
              </div>

              <h2 className="text-white mb-4" style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1px' }}>
                {t.optimizeWith || "Optimize with"} <span style={{ 
                  background: 'linear-gradient(to right, #4ade80, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>PROFITOSAURIOS</span>
              </h2>
              <p className="text-white-70 mb-8" style={{ fontSize: 18, maxWidth: 650, margin: '0 auto', lineHeight: 1.5 }}>
                {t.joinApp || <>Join <strong style={{ color: '#4ade80' }}>PROFITOSAURIOS</strong> today. Streamline your purchases, eliminate wastage, and instantly connect with trusted wholesalers.</>}
              </p>
              <button className="btn-glow btn-lg" onClick={() => onNavigate('lppEngine')} style={{ padding: '14px 32px', fontSize: 16, fontWeight: 600 }}>
                {t.startOpt || "Start Optimizing Now"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

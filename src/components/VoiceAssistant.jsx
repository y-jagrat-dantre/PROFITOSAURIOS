import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useAppContext';

export default function VoiceAssistant() {
  const { settings, t, vegetables, optimizationResults, sales } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const chatEndRef = useRef(null);

  // Auto-scroll chat history
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, transcript, isThinking, errorMsg]);

  // Pre-load voices so they are ready when we need them (Chrome loads them asynchronously)
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.getVoices();
      synth.onvoiceschanged = () => { synth.getVoices(); };
    }
  }, []);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = settings.language === 'en' ? 'en-US' : `${settings.language}-IN`;
      
      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
        setTranscript('');
      };
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error !== 'aborted') {
          setErrorMsg('Microphone error: ' + event.error);
        }
      };
      
      recognitionRef.current = recognition;
    }
  }, [settings.language]);

  // Triggers Gemini API once listening stops and we have a transcript
  useEffect(() => {
    if (!isListening && transcript && !isThinking && !isSpeaking) {
      handleQueryGemini(transcript);
    }
  }, [isListening, transcript]);

  const handleQueryGemini = async (text) => {
    if (!settings.geminiKey) {
      setErrorMsg('Please add your Gemini API Key in Settings first.');
      return;
    }
    
    setIsThinking(true);
    // Add user message to history optimistically
    const newUserMsg = { role: 'user', text };
    setHistory(prev => [...prev, newUserMsg]);
    setTranscript('');
    
    try {
      const contextData = JSON.stringify({
        stock: vegetables.map(v => ({ name: v.name, qty: v.availableQuantity, price: v.sellingPrice, expectedDemand: v.expectedDemand })),
        sales: sales.slice(-10).map(s => ({ name: s.vegetableName, qty: s.quantity, price: s.price })),
        recommendations: optimizationResults.slice(0, 5).map(r => ({ name: r.vegetable.name, buyQty: r.recommendedQty, expProfit: r.expectedProfit }))
      });
      
      const systemInstruction = `You are a helpful Voice AI assistant for the Profitosaurios app (a vegetable vendor app).
IMPORTANT RULES:
1. Always write "Profitosaurios" as "Profit-o-saurus" so text-to-speech pronounces it as a normal word. ${history.length === 0 ? "Since this is the first message, you may briefly mention you are the Profit-o-saurus AI." : "Do NOT introduce yourself or say 'Profit-o-saurus' again. Just answer the user's question directly."}
2. By default, reply in the language corresponding to this code: ${settings.language}. HOWEVER, if the user explicitly asks you to speak or reply in a specific language (e.g., "talk in hindi", "reply in english"), you MUST completely ignore the default code and reply ONLY in the requested language using its native script.
3. Answer concisely and conversationally in 1-3 sentences.
4. Use this context data about the user's business to answer questions about what to sell, buy, or stock: ${contextData}. Be smart and recommend items based on demand and sales.`;
      
      // Build conversation history for Gemini API format
      const apiContents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      apiContents.push({ role: 'user', parts: [{ text }] });

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${settings.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: apiContents,
          generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
        })
      });
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      let reply = data.candidates[0].content.parts[0].text;
      reply = reply.replace(/Profitosaurios/gi, 'Profit-o-saurus').replace(/PROFITOSAURIOS/g, 'Profit-o-saurus');
      
      setResponse(reply);
      setHistory(prev => [...prev, { role: 'assistant', text: reply }]);
      speakText(reply);
      
    } catch (err) {
      console.error(err);
      setErrorMsg('Error connecting to AI: ' + err.message);
      // Remove the optimistically added user message on error so they can try again
      setHistory(prev => prev.slice(0, -1));
    } finally {
      setIsThinking(false);
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;
    
    // Stop any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    const langMap = {
      'hi': 'hi-IN', 'bn': 'bn-IN', 'mr': 'mr-IN', 'te': 'te-IN', 
      'ta': 'ta-IN', 'gu': 'gu-IN', 'ur': 'ur-PK', 'kn': 'kn-IN', 
      'ml': 'ml-IN', 'pa': 'pa-IN', 'en': 'en-IN'
    };
    let bcp47 = langMap[settings.language] || settings.language;
    
    // Auto-detect script from text to override TTS language if AI switched languages
    if (/[\u0900-\u097F]/.test(text)) bcp47 = 'hi-IN'; // Devanagari (Hindi/Marathi)
    else if (/[\u0980-\u09FF]/.test(text)) bcp47 = 'bn-IN'; // Bengali
    else if (/[\u0C00-\u0C7F]/.test(text)) bcp47 = 'te-IN'; // Telugu
    else if (/[\u0B80-\u0BFF]/.test(text)) bcp47 = 'ta-IN'; // Tamil
    else if (/[\u0A80-\u0AFF]/.test(text)) bcp47 = 'gu-IN'; // Gujarati
    else if (/[\u0C80-\u0CFF]/.test(text)) bcp47 = 'kn-IN'; // Kannada
    else if (/[\u0D00-\u0D7F]/.test(text)) bcp47 = 'ml-IN'; // Malayalam
    else if (/[\u0A00-\u0A7F]/.test(text)) bcp47 = 'pa-IN'; // Punjabi
    else if (/[a-zA-Z]/.test(text) && !/[\u0900-\u0D7F]/.test(text)) bcp47 = 'en-IN'; // English fallback
    
    utterance.lang = bcp47;
    
    const voices = synthRef.current.getVoices();
    
    // 1. Try exact match (e.g. hi-IN)
    let voice = voices.find(v => v.lang === bcp47 || v.lang.replace('_', '-') === bcp47);
    
    // 2. Try matching just the language code (e.g. hi)
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith(bcp47.split('-')[0]));
    }
    
    // 3. Try to find any Google specific voice for that language
    if (!voice) {
      voice = voices.find(v => v.name.toLowerCase().includes(bcp47.split('-')[0]));
    }
    
    // 4. Force a generic language voice if specific is not found, to avoid English accent reading Hindi
    if (!voice) {
       voice = voices.find(v => v.lang.includes(bcp47.split('-')[0]));
    }
    
    if (voice) {
      utterance.voice = voice;
    } else {
      // If no voice is found for the language, the browser might fall back to English which sounds weird.
      // We can't do much else, but setting lang usually tells the OS to try its best.
      utterance.lang = bcp47; 
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setErrorMsg('Voice recognition not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Cancel speech if talking
      if (isSpeaking) {
        synthRef.current.cancel();
        setIsSpeaking(false);
        setResponse('');
      }
      setTranscript('');
      setResponse('');
      recognitionRef.current.start();
    }
  };

  const closeAssistant = () => {
    if (isListening) recognitionRef.current?.stop();
    if (isSpeaking) {
      synthRef.current?.cancel();
      setIsSpeaking(false);
    }
    setIsOpen(false);
  };

  // Styles
  const fabStyle = {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0.4)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 9999,
    border: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: isOpen ? 'none' : 'pulse-soft 2s infinite',
  };

  const panelStyle = {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    width: '320px',
    background: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(24px) saturate(150%)',
    WebkitBackdropFilter: 'blur(24px) saturate(150%)',
    isolation: 'isolate',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid rgba(255,255,255,0.6)',
    padding: '24px',
    zIndex: 9998,
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    gap: '16px',
    transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
    opacity: isOpen ? 1 : 0,
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    transformOrigin: 'bottom right'
  };

  const orbStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: isSpeaking ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 
                isThinking ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 
                isListening ? 'linear-gradient(135deg, #10b981, #34d399)' :
                'linear-gradient(135deg, #94a3b8, #cbd5e1)',
    margin: '0 auto',
    boxShadow: isSpeaking ? '0 0 30px rgba(59, 130, 246, 0.5)' : 
               isThinking ? '0 0 30px rgba(245, 158, 11, 0.5)' : 
               isListening ? '0 0 30px rgba(16, 185, 129, 0.5)' : 'none',
    animation: isListening || isSpeaking || isThinking ? 'orb-pulse 1.5s infinite ease-in-out alternate' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '32px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  return (
    <>
      <style>{`
        @keyframes pulse-soft {
          0% { box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0.4); transform: scale(1); }
          70% { box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4), 0 0 0 15px rgba(16, 185, 129, 0); transform: scale(1.05); }
          100% { box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0); transform: scale(1); }
        }
        @keyframes orb-pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          100% { transform: scale(1.1); opacity: 1; }
        }
        .voice-text {
          font-size: 15px;
          line-height: 1.5;
          text-align: center;
          color: #334155;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }
      `}</style>

      {/* Floating Button */}
      <button 
        style={fabStyle} 
        onClick={() => setIsOpen(!isOpen)}
        title="AI Voice Assistant"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
        )}
      </button>

      {/* Overlay Panel */}
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>PROFITOSAURIOS AI</h3>
          <button onClick={closeAssistant} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div style={orbStyle} onClick={toggleMic}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
        </div>
        
        <div className="chat-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 8px', minHeight: '150px', maxHeight: '300px' }}>
          {history.length === 0 && !transcript && !isListening && !isThinking && !errorMsg && (
            <div style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto' }}>Tap the mic and say something!</div>
          )}
          
          {history.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', 
              background: msg.role === 'user' ? '#e2e8f0' : '#dbeafe', 
              padding: '8px 12px', 
              borderRadius: '12px', 
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
              maxWidth: '85%', 
              fontSize: '14px', 
              color: '#1e293b',
              lineHeight: 1.4
            }}>
              {msg.text}
            </div>
          ))}

          {/* Current Activity */}
          {transcript && (
            <div style={{ alignSelf: 'flex-end', background: '#e2e8f0', padding: '8px 12px', borderRadius: '12px', borderBottomRightRadius: '4px', maxWidth: '85%', fontSize: '14px', color: '#1e293b', lineHeight: 1.4 }}>
              {transcript}
            </div>
          )}
          {isListening && !transcript && (
            <div style={{ alignSelf: 'flex-end', color: '#10b981', fontSize: '14px', fontStyle: 'italic', padding: '8px 12px' }}>
              Listening...
            </div>
          )}
          {isThinking && (
            <div style={{ alignSelf: 'flex-start', background: '#dbeafe', padding: '8px 12px', borderRadius: '12px', borderBottomLeftRadius: '4px', maxWidth: '85%', fontSize: '14px', color: '#1e293b' }}>
               <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Thinking...</span>
            </div>
          )}
          {errorMsg && (
            <div style={{ alignSelf: 'center', color: '#ef4444', fontSize: '14px', marginTop: '8px', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
    </>
  );
}

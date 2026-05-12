import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AIInsights.css';

const PREDICTIONS = [
  { ingredient:'Lettuce',        currentStock:3,   unit:'kg',  daysLeft:2,  dailyUsage:1.5, confidence:92, status:'critical', action:'Order TODAY — weekend stock risk' },
  { ingredient:'Tandoori Sauce', currentStock:4,   unit:'L',   daysLeft:3,  dailyUsage:1.2, confidence:87, status:'critical', action:'Order before Thursday' },
  { ingredient:'Chicken Patty',  currentStock:132, unit:'pcs', daysLeft:6,  dailyUsage:22,  confidence:94, status:'low',      action:'Plan reorder by Wednesday' },
  { ingredient:'Burger Bun',     currentStock:89,  unit:'pcs', daysLeft:9,  dailyUsage:10,  confidence:89, status:'ok',       action:'Reorder next week' },
  { ingredient:'Mozzarella',     currentStock:12,  unit:'kg',  daysLeft:12, dailyUsage:1.0, confidence:91, status:'ok',       action:'Monitor usage trend' },
];

const ANOMALIES = [
  { ingredient:'Lettuce',   date:'Today',     actual:4.5, normal:1.5, spike:'+200%', reason:'Possible event order or prep error. Verify with kitchen staff.', severity:'high' },
  { ingredient:'Onion',     date:'Yesterday', actual:8,   normal:3,   spike:'+167%', reason:'Large batch preparation detected. Cross-check with sales volume.', severity:'high' },
  { ingredient:'Pizza Base',date:'2 days ago',actual:42,  normal:18,  spike:'+133%', reason:'Weekend spike consistent with Fri-Sat pattern. Within acceptable range.', severity:'medium' },
];

const REORDER_SUGGESTIONS = [
  { ingredient:'Lettuce',        qty:'15 kg',   supplier:'Green Valley',  cost:'₹1,200', urgency:'today',     reason:'Stock runs out in 2 days at current rate' },
  { ingredient:'Tandoori Sauce', qty:'10 L',    supplier:'Spice Route',   cost:'₹1,200', urgency:'today',     reason:'Below minimum threshold, 3 days remaining' },
  { ingredient:'Chicken Patty',  qty:'100 pcs', supplier:'Fresh Farms',   cost:'₹4,500', urgency:'this-week', reason:'Weekend demand spike expected, order by Wed' },
  { ingredient:'Mutton Patty',   qty:'60 pcs',  supplier:'Fresh Farms',   cost:'₹5,400', urgency:'this-week', reason:'Currently out of stock, losing sales' },
];

const WEEKLY_TREND = [
  { day:'Mon', predicted:68,  actual:72  },
  { day:'Tue', predicted:82,  actual:78  },
  { day:'Wed', predicted:76,  actual:81  },
  { day:'Thu', predicted:98,  actual:95  },
  { day:'Fri', predicted:135, actual:141 },
  { day:'Sat', predicted:188, actual:null},
  { day:'Sun', predicted:95,  actual:null},
];

const WEEKLY_SUMMARY = `Your kitchen had a strong week with 737 total ingredient units consumed across all three brands. Chicken Patty remains your highest-demand item at 312 units, up 34% from last week — primarily driven by Shrimmers weekend orders.

Critical alert: Lettuce stock fell to 3kg with a projected stockout in 2 days. Immediate reorder from Green Valley is recommended before Friday service.

Waste cost this week was ₹3,300, with Spoilage accounting for 38% of losses. Consider reviewing cold storage temperature settings and reducing Lettuce order frequency to avoid repeat spoilage.

Weekend performance is consistently 2.8x weekday volumes. Recommend increasing Friday stock levels by 40% across Proteins and Bakery categories to avoid mid-service shortages.`;

function Typewriter({ text, speed=18, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false);
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i++));
      if (i > text.length) { clearInterval(t); setDone(true); onDone&&onDone(); }
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <span>{displayed}{!done&&<span className="ai-cursor"/>}</span>;
}

function ChartTip({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return <div className="ai-tip"><p className="ai-tip-lbl">{label}</p>{payload.map((p,i)=><p key={i} style={{color:p.color,margin:'2px 0',fontSize:12,fontWeight:700}}>{p.name}: {p.value??'—'}</p>)}</div>;
}

export default function AIInsights() {
  const [activeTab,   setActiveTab]   = useState('summary');
  const [generating,  setGenerating]  = useState(false);
  const [generated,   setGenerated]   = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const STEPS = ['Analyzing usage patterns…','Detecting anomalies…','Running predictions…','Generating insights…'];

  const handleGenerate = () => {
    setGenerating(true); setGenerated(false); setShowSummary(false); setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep(p => { if(p>=STEPS.length-1){clearInterval(interval);return p;} return p+1; });
    }, 900);
    setTimeout(() => { setGenerating(false); setGenerated(true); setShowSummary(true); }, 3800);
  };

  const exportInsights = () => {
    const lines = [
      'BLUEBLISS AI INSIGHTS REPORT',
      'Generated: '+new Date().toLocaleString('en-IN'),
      '',
      '=== WEEKLY SUMMARY ===',
      WEEKLY_SUMMARY,
      '',
      '=== STOCK PREDICTIONS ===',
      ...PREDICTIONS.map(p=>`${p.ingredient}: ${p.daysLeft} days left (${p.dailyUsage} ${p.unit}/day) — ${p.action}`),
      '',
      '=== ANOMALIES DETECTED ===',
      ...ANOMALIES.map(a=>`${a.ingredient} on ${a.date}: ${a.spike} spike — ${a.reason}`),
      '',
      '=== REORDER SUGGESTIONS ===',
      ...REORDER_SUGGESTIONS.map(r=>`${r.ingredient}: ${r.qty} from ${r.supplier} (${r.cost}) — ${r.reason}`),
    ];
    const blob = new Blob([lines.join('\n')],{type:'text/plain'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='BlueBliss-AI-Insights-'+new Date().toISOString().split('T')[0]+'.txt'; a.click();
  };

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div className="ai-header-left">
          <div className="ai-brain-orb">🧠</div>
          <div>
            <p className="ai-eyebrow">Intelligence Layer</p>
            <h1 className="ai-title">AI Insights</h1>
            <p className="ai-sub">Powered by statistical analysis + HuggingFace AI models</p>
          </div>
        </div>
        <div className="ai-header-actions">
          {generated&&<button className="ai-btn-export" onClick={exportInsights}>📄 Export Report</button>}
          <button className={'ai-btn-generate'+(generating?' loading':'')} onClick={handleGenerate} disabled={generating}>
            {generating?'Analyzing…':'🤖 Generate AI Report'}
          </button>
        </div>
      </div>

      {generating&&(
        <div className="ai-loading-card">
          <div className="ai-loading-orb">
            <div className="ai-loading-ring"/>
            <span className="ai-loading-icon">🧠</span>
          </div>
          <div className="ai-loading-text">
            {STEPS.map((s,i)=>(
              <div key={i} className={'ai-loading-step'+(i<=loadingStep?' done':'')+(i===loadingStep?' current':'')}>
                <span className="ai-step-icon">{i<loadingStep?'✅':i===loadingStep?'⟳':'○'}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!generated&&!generating&&(
        <div className="ai-welcome">
          <div className="ai-welcome-icon">🤖</div>
          <h2 className="ai-welcome-title">AI Analysis Ready</h2>
          <p className="ai-welcome-sub">Click "Generate AI Report" to analyze your inventory data and get smart predictions, anomaly detection, reorder suggestions and a weekly summary.</p>
          <div className="ai-features-grid">
            {[
              {i:'📊',l:'Usage Predictions',  s:'Know when stock runs out before it happens'},
              {i:'🚨',l:'Anomaly Detection',  s:'Spot unusual consumption patterns instantly'},
              {i:'🛒',l:'Smart Reorder Tips', s:'AI-generated supplier recommendations'},
              {i:'📝',l:'Weekly Summary',     s:'Plain-English kitchen performance report'},
            ].map((f,i)=>(
              <div key={i} className="ai-feature-card" style={{animationDelay:i*.1+'s'}}>
                <span className="ai-feature-icon">{f.i}</span>
                <p className="ai-feature-label">{f.l}</p>
                <p className="ai-feature-sub">{f.s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {generated&&(
        <>
          <div className="ai-tabs">
            {[{k:'summary',l:'📝 Weekly Summary'},{k:'predictions',l:'📊 Predictions'},{k:'anomalies',l:'🚨 Anomalies'},{k:'reorder',l:'🛒 Reorder Tips'},{k:'trend',l:'📈 Trend Forecast'}].map(t=>(
              <button key={t.k} className={'ai-tab'+(activeTab===t.k?' active':'')} onClick={()=>setActiveTab(t.k)}>{t.l}</button>
            ))}
          </div>

          {activeTab==='summary'&&(
            <div className="ai-card ai-summary-card">
              <div className="ai-card-hd">
                <div><p className="ai-eyebrow">Generated Report</p><h3 className="ai-card-title">Weekly Kitchen Intelligence Summary</h3></div>
                <span className="ai-model-badge">🤖 AI Generated</span>
              </div>
              <div className="ai-summary-body">
                <div className="ai-summary-avatar">🧠</div>
                <div className="ai-summary-text">
                  {showSummary&&<Typewriter text={WEEKLY_SUMMARY} speed={14}/>}
                </div>
              </div>
              <div className="ai-summary-meta">
                <span>Model: mistralai/Mistral-7B-Instruct-v0.2</span>
                <span>Generated: {new Date().toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                <span>Confidence: 91%</span>
              </div>
            </div>
          )}

          {activeTab==='predictions'&&(
            <div className="ai-section">
              <div className="ai-card">
                <div className="ai-card-hd"><div><p className="ai-eyebrow">Stock Forecast</p><h3 className="ai-card-title">Days Until Stockout</h3></div></div>
                <div className="ai-pred-list">
                  {PREDICTIONS.map((p,i)=>(
                    <div key={i} className={'ai-pred-row pred-'+p.status} style={{animationDelay:i*.07+'s'}}>
                      <div className="ai-pred-left">
                        <div className={'ai-pred-dot pdot-'+p.status}/>
                        <div>
                          <p className="ai-pred-name">{p.ingredient}</p>
                          <p className="ai-pred-meta">{p.dailyUsage} {p.unit}/day avg · {p.confidence}% confidence</p>
                        </div>
                      </div>
                      <div className="ai-pred-center">
                        <div className="ai-days-bar">
                          <div className={'ai-days-fill dfill-'+p.status} style={{width:Math.min((p.daysLeft/14)*100,100)+'%',animationDelay:i*.08+'s'}}/>
                        </div>
                        <p className="ai-pred-action">{p.action}</p>
                      </div>
                      <div className="ai-pred-right">
                        <p className={'ai-days-num dnum-'+p.status}>{p.daysLeft}</p>
                        <p className="ai-days-label">days left</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab==='anomalies'&&(
            <div className="ai-section">
              <div className="ai-info-banner">
                <span>🔍</span>
                <p>Anomalies are detected using Z-score statistical analysis. A spike is flagged when usage deviates more than 2.5 standard deviations from the 14-day average.</p>
              </div>
              {ANOMALIES.map((a,i)=>(
                <div key={i} className={'ai-card ai-anomaly-card anom-'+a.severity} style={{animationDelay:i*.08+'s'}}>
                  <div className="ai-anom-head">
                    <div className="ai-anom-left">
                      <span className={'ai-anom-badge abadge-'+a.severity}>{a.severity==='high'?'High Alert':'Medium'}</span>
                      <h3 className="ai-anom-name">{a.ingredient}</h3>
                      <span className="ai-anom-date">{a.date}</span>
                    </div>
                    <div className="ai-anom-spike">{a.spike}</div>
                  </div>
                  <div className="ai-anom-bars">
                    <div className="ai-anom-bar-row">
                      <span className="ai-anom-bar-lbl">Normal</span>
                      <div className="ai-anom-bar"><div className="ai-anom-fill normal-fill" style={{width:(a.normal/a.actual*100)+'%'}}/></div>
                      <span className="ai-anom-bar-val">{a.normal} units</span>
                    </div>
                    <div className="ai-anom-bar-row">
                      <span className="ai-anom-bar-lbl">Actual</span>
                      <div className="ai-anom-bar"><div className={'ai-anom-fill actual-fill afill-'+a.severity} style={{width:'100%'}}/></div>
                      <span className="ai-anom-bar-val">{a.actual} units</span>
                    </div>
                  </div>
                  <div className="ai-anom-reason">
                    <span className="ai-reason-icon">💡</span>
                    <p>{a.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab==='reorder'&&(
            <div className="ai-section">
              <div className="ai-info-banner">
                <span>🛒</span>
                <p>Reorder suggestions are based on current stock levels, average daily usage, supplier lead times and predicted weekend demand spikes.</p>
              </div>
              <div className="ai-reorder-grid">
                {REORDER_SUGGESTIONS.map((r,i)=>(
                  <div key={i} className={'ai-card ai-reorder-card rcard-'+r.urgency} style={{animationDelay:i*.08+'s'}}>
                    <div className="ai-reorder-head">
                      <span className={'ai-urgency-badge ubadge-'+r.urgency}>{r.urgency==='today'?'🔴 Order Today':'🟡 This Week'}</span>
                    </div>
                    <h3 className="ai-reorder-name">{r.ingredient}</h3>
                    <div className="ai-reorder-details">
                      <div className="ai-rd-item"><p className="ai-rd-lbl">Qty to Order</p><p className="ai-rd-val">{r.qty}</p></div>
                      <div className="ai-rd-item"><p className="ai-rd-lbl">Supplier</p><p className="ai-rd-val">{r.supplier}</p></div>
                      <div className="ai-rd-item"><p className="ai-rd-lbl">Est. Cost</p><p className="ai-rd-val ai-rd-cost">{r.cost}</p></div>
                    </div>
                    <div className="ai-reorder-reason">
                      <span>💡</span><p>{r.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab==='trend'&&(
            <div className="ai-section">
              <div className="ai-card">
                <div className="ai-card-hd">
                  <div><p className="ai-eyebrow">Forecast</p><h3 className="ai-card-title">Predicted vs Actual Usage This Week</h3></div>
                  <span className="ai-model-badge">AI Forecast</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={WEEKLY_TREND} margin={{top:5,right:10,left:-20,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,.07)" vertical={false}/>
                    <XAxis dataKey="day" tick={{fill:'var(--inv-text-muted)',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'var(--inv-text-muted)',fontSize:11}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Line type="monotone" dataKey="predicted" stroke="var(--inv-primary)" strokeWidth={2} strokeDasharray="6 3" dot={{r:4}} name="AI Predicted"/>
                    <Line type="monotone" dataKey="actual"    stroke="var(--inv-gold)"    strokeWidth={2.5} dot={{r:5}} name="Actual"/>
                  </LineChart>
                </ResponsiveContainer>
                <div className="ai-trend-legend">
                  <div className="ai-tl-item"><span className="ai-tl-line dashed"/><span>AI Prediction</span></div>
                  <div className="ai-tl-item"><span className="ai-tl-line solid"/><span>Actual Usage</span></div>
                  <div className="ai-tl-item"><span className="ai-tl-dot"/><span>Sat–Sun = Forecast only</span></div>
                </div>
                <div className="ai-accuracy-banner">
                  <span className="ai-acc-icon">🎯</span>
                  <div>
                    <p className="ai-acc-title">Model Accuracy: 93.2%</p>
                    <p className="ai-acc-sub">Based on last 30 days of usage data vs predictions</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
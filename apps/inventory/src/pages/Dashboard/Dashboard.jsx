import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const INGREDIENTS = [
  { id:1, name:'Chicken Patty',  category:'Proteins',   unit:'pcs', currentStock:132, minThreshold:30, maxStock:200, costPerUnit:45,  updatedAt:'2h ago' },
  { id:2, name:'Lettuce',        category:'Vegetables', unit:'kg',  currentStock:3,   minThreshold:5,  maxStock:20,  costPerUnit:80,  updatedAt:'5h ago' },
  { id:3, name:'Burger Bun',     category:'Bakery',     unit:'pcs', currentStock:89,  minThreshold:40, maxStock:200, costPerUnit:8,   updatedAt:'1h ago' },
  { id:4, name:'Mutton Patty',   category:'Proteins',   unit:'pcs', currentStock:0,   minThreshold:20, maxStock:100, costPerUnit:90,  updatedAt:'1d ago' },
  { id:5, name:'Cheese Slice',   category:'Dairy',      unit:'pcs', currentStock:56,  minThreshold:20, maxStock:150, costPerUnit:15,  updatedAt:'3h ago' },
  { id:6, name:'Tomato',         category:'Vegetables', unit:'kg',  currentStock:8,   minThreshold:3,  maxStock:25,  costPerUnit:40,  updatedAt:'6h ago' },
  { id:7, name:'Tandoori Sauce', category:'Condiments', unit:'L',   currentStock:4,   minThreshold:5,  maxStock:20,  costPerUnit:120, updatedAt:'2d ago' },
  { id:8, name:'Pizza Base',     category:'Bakery',     unit:'pcs', currentStock:45,  minThreshold:20, maxStock:100, costPerUnit:25,  updatedAt:'4h ago' },
];
const USAGE_DATA = [
  { date:'Mon', used:24, waste:2 },{ date:'Tue', used:31, waste:1 },
  { date:'Wed', used:28, waste:3 },{ date:'Thu', used:42, waste:2 },
  { date:'Fri', used:55, waste:4 },{ date:'Sat', used:68, waste:5 },
  { date:'Sun', used:38, waste:2 },
];
const ACTIVITY = [
  { type:'update', text:'Chicken Patty updated to 132 pcs',  time:'2h ago',    icon:'📦' },
  { type:'alert',  text:'Lettuce below minimum threshold',    time:'5h ago',    icon:'⚠️' },
  { type:'order',  text:'PO-202605-001 created',             time:'Yesterday', icon:'🛒' },
  { type:'waste',  text:'2kg Lettuce logged as spoilage',     time:'Yesterday', icon:'🗑️' },
  { type:'update', text:'Burger Bun restocked to 89 pcs',    time:'2d ago',    icon:'📦' },
];
const CAT_IMG = {
  Proteins:   'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=80&h=56&fit=crop',
  Vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=80&h=56&fit=crop',
  Bakery:     'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=80&h=56&fit=crop',
  Dairy:      'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=80&h=56&fit=crop',
  Condiments: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=80&h=56&fit=crop',
};

function Counter({ to, prefix='', suffix='' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.ceil(to / 50));
    const t = setInterval(() => { cur = Math.min(cur+step,to); setN(cur); if(cur>=to) clearInterval(t); }, 25);
    return () => clearInterval(t);
  }, [to]);
  return React.createElement(React.Fragment, null, prefix+n+suffix);
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return React.createElement('div', {className:'dash-tip'},
    React.createElement('p', {className:'dash-tip-label'}, label),
    payload.map((p,i) => React.createElement('p', {key:i, style:{color:p.color,margin:'2px 0',fontSize:12,fontWeight:700}}, p.name+': '+p.value))
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [clock, setClock] = useState(new Date());
  const [aiText, setAiText] = useState('');
  const AI = 'Your chicken patty usage is up 34% this week. Lettuce will run out in approximately 2 days. Recommend placing a purchase order today to avoid weekend stockouts.';
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { setAiText(AI.slice(0,i++)); if(i>AI.length) clearInterval(t); }, 20);
    return () => clearInterval(t);
  }, []);
  const total=INGREDIENTS.length, critical=INGREDIENTS.filter(i=>i.currentStock===0).length;
  const low=INGREDIENTS.filter(i=>i.currentStock>0&&i.currentStock<=i.minThreshold).length;
  const healthy=INGREDIENTS.filter(i=>i.currentStock>i.minThreshold).length;
  const stockVal=INGREDIENTS.reduce((s,i)=>s+i.currentStock*i.costPerUnit,0);
  const alerts=INGREDIENTS.filter(i=>i.currentStock<=i.minThreshold);
  const g=clock.getHours()<12?'Good Morning':clock.getHours()<17?'Good Afternoon':'Good Evening';
  const dateStr=clock.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
  const timeStr=clock.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const catData=Object.entries(INGREDIENTS.reduce((a,i)=>{a[i.category]=(a[i.category]||0)+1;return a;},{})).map(([c,n])=>({c,n}));
  return (
    <div className="dash-page">
      <div className="dash-hero">
        <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&h=280&fit=crop" alt="" className="dash-hero-bg"/>
        <div className="dash-hero-grad"/>
        <div className="dash-hero-inner">
          <div className="dash-hero-text">
            <p className="dash-greeting-tag">{g} Chef</p>
            <h1 className="dash-hero-title">BlueBliss Kitchen</h1>
            <p className="dash-hero-date">{dateStr}</p>
            <div className="dash-hero-clock">{timeStr}</div>
            <div className="dash-hero-badges">
              <span className="dash-hero-badge badge-green">All Kitchens Open</span>
              <span className="dash-hero-badge badge-gold">{alerts.length} Alert{alerts.length!==1?'s':''}</span>
            </div>
          </div>
          <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=220&h=280&fit=crop&crop=top" alt="Chef" className="dash-hero-chef"/>
        </div>
      </div>
      <div className="dash-content">
        <div className="dash-kpi-row">
          {[
            {label:'Total Items',  value:total,              accent:'primary',icon:'📦',sub:'tracked'},
            {label:'Healthy',      value:healthy,            accent:'green',  icon:'✅',sub:'above threshold'},
            {label:'Low Stock',    value:low,                accent:'orange', icon:'⚠️',sub:'need attention'},
            {label:'Critical',     value:critical,           accent:'red',    icon:'🔴',sub:'out of stock'},
            {label:'Stock Value',  value:Math.round(stockVal/1000),prefix:'₹',suffix:'k',accent:'gold',icon:'💰',sub:'inventory value'},
          ].map((k,i)=>(
            <div key={i} className={'dash-kpi kpi-'+k.accent} style={{animationDelay:i*0.1+'s'}}>
              <div className="dash-kpi-head"><span className="dash-kpi-icon">{k.icon}</span><p className="dash-kpi-label">{k.label}</p></div>
              <p className="dash-kpi-val"><Counter to={k.value} prefix={k.prefix||''} suffix={k.suffix||''}/></p>
              <p className="dash-kpi-sub">{k.sub}</p>
              <div className="dash-kpi-line"><div className="dash-kpi-prog"/></div>
            </div>
          ))}
        </div>
        <div className="dash-mid-row">
          <div className="dash-card">
            <div className="dash-card-hd">
              <div><p className="dash-eyebrow">Urgent</p><h3 className="dash-card-title">Stock Alerts</h3></div>
              <span className="dash-badge-count">{alerts.length}</span>
            </div>
            <div className="dash-alert-list">
              {alerts.length===0?<div className="dash-empty-state"><span>✅</span><p>All levels healthy</p></div>
              :alerts.map((item,i)=>{const s=item.currentStock===0?'critical':'low';return(
                <div key={i} className={'dash-alert-item alert-'+s}>
                  <span className={'dash-alert-dot adot-'+s}/>
                  <div className="dash-alert-info">
                    <p className="dash-alert-name">{item.name}</p>
                    <p className="dash-alert-sub">{item.currentStock} {item.unit} · {s==='critical'?'OUT OF STOCK':'Below minimum'}</p>
                  </div>
                  <button className="dash-order-btn" onClick={()=>navigate('/purchase-orders')}>Order</button>
                </div>
              );})}
            </div>
          </div>
          <div className="dash-card dash-ai-card">
            <div className="dash-card-hd">
              <div><p className="dash-eyebrow">Intelligence</p><h3 className="dash-card-title">AI Insight</h3></div>
              <span className="dash-ai-pill">🤖 Live</span>
            </div>
            <div className="dash-ai-body">
              <div className="dash-ai-orb">🧠</div>
              <p className="dash-ai-text">{aiText}<span className="dash-cursor"/></p>
            </div>
            <button className="dash-ai-cta" onClick={()=>navigate('/ai')}>Full AI Report →</button>
          </div>
          <div className="dash-card dash-kitchen-snap">
            <img src="https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=500&h=180&fit=crop" alt="" className="dash-kitchen-photo"/>
            <div className="dash-kitchen-info">
              <p className="dash-kitchen-tag">Kitchen Status</p>
              <p className="dash-kitchen-status">🟢 Operational</p>
              <p className="dash-kitchen-brands">Shrimmers · Peppanizze · Urban Wrap</p>
            </div>
          </div>
        </div>
        <div className="dash-chart-row">
          <div className="dash-card">
            <div className="dash-card-hd">
              <div><p className="dash-eyebrow">This Week</p><h3 className="dash-card-title">Usage vs Waste</h3></div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={USAGE_DATA} margin={{top:5,right:5,left:-25,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.07)" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:'var(--inv-text-muted)',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'var(--inv-text-muted)',fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Bar dataKey="used"  fill="var(--inv-primary)" radius={[4,4,0,0]} maxBarSize={24} name="Used"/>
                <Bar dataKey="waste" fill="var(--inv-red)"     radius={[4,4,0,0]} maxBarSize={24} name="Waste"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-card">
            <div className="dash-card-hd"><div><p className="dash-eyebrow">Breakdown</p><h3 className="dash-card-title">By Category</h3></div></div>
            <div className="dash-cat-list">
              {catData.map(({c,n},i)=>(
                <div key={i} className="dash-cat-row" style={{animationDelay:i*0.1+'s'}}>
                  <img src={CAT_IMG[c]||CAT_IMG.Condiments} alt={c} className="dash-cat-img"/>
                  <span className="dash-cat-name">{c}</span>
                  <div className="dash-cat-bar"><div className="dash-cat-fill" style={{width:(n/total*100)+'%',animationDelay:i*0.12+'s'}}/></div>
                  <span className="dash-cat-num">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="dash-bottom-row">
          <div className="dash-card">
            <div className="dash-card-hd"><div><p className="dash-eyebrow">Live Feed</p><h3 className="dash-card-title">Recent Activity</h3></div></div>
            <div className="dash-activity">
              {ACTIVITY.map((a,i)=>(
                <div key={i} className="dash-act-row" style={{animationDelay:i*0.08+'s'}}>
                  <span className="dash-act-icon">{a.icon}</span>
                  <div><p className="dash-act-text">{a.text}</p><p className="dash-act-time">{a.time}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-hd"><div><p className="dash-eyebrow">Shortcuts</p><h3 className="dash-card-title">Quick Actions</h3></div></div>
            <div className="dash-actions">
              {[
                {icon:'📦',label:'Update Stock', path:'/stock'},
                {icon:'🗑️',label:'Log Waste',    path:'/waste'},
                {icon:'🛒',label:'Create PO',    path:'/purchase-orders'},
                {icon:'📊',label:'Reports',      path:'/reports'},
                {icon:'🤖',label:'AI Insights',  path:'/ai'},
                {icon:'🏭',label:'Suppliers',    path:'/suppliers'},
              ].map((a,i)=>(
                <button key={i} className="dash-action-btn" style={{animationDelay:i*0.07+'s'}} onClick={()=>navigate(a.path)}>
                  <span className="dash-action-icon">{a.icon}</span>
                  <span className="dash-action-label">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-hd">
            <div><p className="dash-eyebrow">Overview</p><h3 className="dash-card-title">All Ingredients</h3></div>
            <button className="dash-view-all" onClick={()=>navigate('/stock')}>View All →</button>
          </div>
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead><tr><th>Ingredient</th><th>Category</th><th>Stock</th><th>Unit</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>
                {INGREDIENTS.map((item,i)=>{
                  const pct=Math.min((item.currentStock/item.maxStock)*100,100);
                  const s=item.currentStock===0?'critical':item.currentStock<=item.minThreshold?'low':'good';
                  return(
                    <tr key={i} className={'dash-tr dtr-'+s}>
                      <td><div className="dash-td-name"><img src={CAT_IMG[item.category]||CAT_IMG.Condiments} alt="" className="dash-row-img"/><span>{item.name}</span></div></td>
                      <td className="dash-td-cat">{item.category}</td>
                      <td><div className="dash-mini-wrap"><div className="dash-mini-bar"><div className={'dash-mini-fill mfill-'+s} style={{width:pct+'%',animationDelay:i*0.05+'s'}}/></div><span className="dash-mini-num">{item.currentStock}</span></div></td>
                      <td>{item.unit}</td>
                      <td><span className={'dash-chip chip-'+s}>{s==='critical'?'Critical':s==='low'?'Low':'OK'}</span></td>
                      <td className="dash-td-time">{item.updatedAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
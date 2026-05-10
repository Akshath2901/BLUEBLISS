// src/jsx/home.jsx — BlueBliss V2.0 International Premium
import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CartContext } from "../context/CartContext";
import SearchBar from "./SearchBar";
import Footer from "./Footer";
import "./home.css";

import image1 from "./pics/PHOTO-2026-01-21-19-58-28 9.jpg";
import image2 from "./pics/PHOTO-2026-01-21-19-58-28 15.jpg";
import image3 from "./pics/PHOTO-2026-01-21-20-05-16 8.jpg";

/* ─── Keyword routing ───────────────────────────────────── */
const KEYWORD_ROUTES = {
  burger:"/menu/shrimmers", burgers:"/menu/shrimmers", crispy:"/menu/shrimmers",
  fries:"/menu/shrimmers", milkshake:"/menu/shrimmers", shake:"/menu/shrimmers",
  "peri peri":"/menu/shrimmers", shrimmers:"/menu/shrimmers",
  pizza:"/menu/peppanizze", pizzas:"/menu/peppanizze", paneer:"/menu/peppanizze",
  peppanizze:"/menu/peppanizze", vegetarian:"/menu/peppanizze",
  wrap:"/menu/urbanwrap", wraps:"/menu/urbanwrap", roll:"/menu/urbanwrap",
  urbanwrap:"/menu/urbanwrap",
};

function getRouteForQuery(q) {
  const query = q.toLowerCase().trim();
  if (KEYWORD_ROUTES[query]) return KEYWORD_ROUTES[query];
  const scores = { "/menu/shrimmers":0, "/menu/peppanizze":0, "/menu/urbanwrap":0 };
  for (const [kw, route] of Object.entries(KEYWORD_ROUTES)) {
    if (query.includes(kw)) scores[route] += kw.length;
  }
  const best = Object.entries(scores).sort((a,b) => b[1]-a[1])[0];
  return best[1] > 0 ? best[0] : "/menu/shrimmers";
}

/* ─── Static data ───────────────────────────────────────── */
const BRAND_CONFIG = [
  { id:1, name:"Shrimmers",  icon:"✨", tagline:"Burgers · Shakes · Fries",   desc:"Premium burgers crafted to absolute perfection", route:"/menu/shrimmers",  col:"menu",  color:"#F2C35A" },
  { id:2, name:"Peppanizze", icon:"🌶️", tagline:"Pizzas · Paneer · Spice",    desc:"Bold wood-fired flavours with an Indian twist",   route:"/menu/peppanizze", col:"Pmenu", color:"#FF6B5B" },
  { id:3, name:"UrbanWrap",  icon:"🌯", tagline:"Wraps · Rolls · Fresh",      desc:"Fresh wraps packed with vibrant ingredients",     route:"/menu/urbanwrap",  col:"Umenu", color:"#00D4AA" },
];

const FOOD_CATEGORIES = [
  { id:1, emoji:"🍔", name:"Burgers",    query:"burger"    },
  { id:2, emoji:"🍕", name:"Pizza",      query:"pizza"     },
  { id:3, emoji:"🍟", name:"Fries",      query:"fries"     },
  { id:4, emoji:"🥤", name:"MilkShakes", query:"milkshake" },
  { id:5, emoji:"🌯", name:"Wraps",      query:"wrap"      },
  { id:6, emoji:"🌶️", name:"Peri Peri",  query:"peri peri" },
];

const STATS = [
  { value:"4.2", suffix:"★", label:"Customer Rating", icon:"⭐" },
  { value:"52",  suffix:"+", label:"Menu Items",      icon:"🍽️" },
  { value:"3",   suffix:"",  label:"Premium Brands",  icon:"✨" },
  { value:"45",  suffix:"m", label:"Avg Delivery",    icon:"⚡" },
];

const DEFAULT_OFFERS = [
  { id:1, title:"BUY 2 BURGERS FOR ₹99",   description:"Valid till 25th Dec", code:"BURGER99", icon:"🍔" },
  { id:2, title:"GET 50% OFF ON PIZZA",    description:"Valid till 30th Dec", code:"PIZZA50",  icon:"🍕" },
  { id:3, title:"FREE DELIVERY ABOVE ₹199", description:"Valid till 28th Dec", code:"FREEDEL",  icon:"🚚" },
];

const REVIEWS = [
  { name:"Akash R.",  text:"Best burgers in Hyderabad. Juicy, perfectly seasoned — I'm hooked.",     stars:5, city:"Banjara Hills"   },
  { name:"Sneha K.",  text:"Loved the wraps. Packaging & taste both absolutely top notch.",           stars:5, city:"Jubilee Hills"   },
  { name:"Rahul M.",  text:"Fast delivery and premium quality food. Never disappoints.",              stars:4, city:"Kondapur"        },
  { name:"Priya S.",  text:"The peri peri fries are insane. Crispy, spicy, addictive. 10/10.",       stars:5, city:"Madhapur"        },
  { name:"Arjun V.",  text:"UrbanWrap is my weekly go-to. Fresh ingredients every single time.",     stars:5, city:"Gachibowli"      },
  { name:"Meera T.",  text:"Peppanizze pizza is a hidden gem. The crust is absolute perfection.",   stars:5, city:"Himayatnagar"    },
  { name:"Kiran P.",  text:"Ordered for my office — 20 people, all loved it. Will order again!",    stars:5, city:"HITEC City"      },
  { name:"Ananya D.", text:"The milkshakes alone are worth visiting. Rich, thick, incredible.",     stars:5, city:"Kukatpally"      },
  // duplicates for infinite loop
  { name:"Akash R.",  text:"Best burgers in Hyderabad. Juicy, perfectly seasoned — I'm hooked.",     stars:5, city:"Banjara Hills"   },
  { name:"Sneha K.",  text:"Loved the wraps. Packaging & taste both absolutely top notch.",           stars:5, city:"Jubilee Hills"   },
  { name:"Rahul M.",  text:"Fast delivery and premium quality food. Never disappoints.",              stars:4, city:"Kondapur"        },
  { name:"Priya S.",  text:"The peri peri fries are insane. Crispy, spicy, addictive. 10/10.",       stars:5, city:"Madhapur"        },
  { name:"Arjun V.",  text:"UrbanWrap is my weekly go-to. Fresh ingredients every single time.",     stars:5, city:"Gachibowli"      },
  { name:"Meera T.",  text:"Peppanizze pizza is a hidden gem. The crust is absolute perfection.",   stars:5, city:"Himayatnagar"    },
  { name:"Kiran P.",  text:"Ordered for my office — 20 people, all loved it. Will order again!",    stars:5, city:"HITEC City"      },
  { name:"Ananya D.", text:"The milkshakes alone are worth visiting. Rich, thick, incredible.",     stars:5, city:"Kukatpally"      },
];

const HERO_PARTICLES = ["🍔","🍕","🌯","🥤","🍟","🌶️"];

/* ─── Scroll reveal hook ─────────────────────────────────── */
function useScrollReveal() {
  const obs = useRef(null);
  return useCallback((node) => {
    if (!node) return;
    obs.current?.disconnect();
    obs.current = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.current?.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    node.querySelectorAll(".reveal").forEach(el => obs.current?.observe(el));
  }, []);
}

/* ─── Home Component ─────────────────────────────────────── */
export default function Home() {
  const navigate    = useNavigate();
  const revealRef   = useScrollReveal();

  const [slide,    setSlide]    = useState(0);
  const [offers,   setOffers]   = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Cart context — for ADD buttons in trending section
  const cartCtx = useContext(CartContext);
  const addToCart    = cartCtx?.addToCart    || (() => {});
  const getItemQty   = cartCtx?.getItemQty   || (() => 0);
  const increaseQty  = cartCtx?.increaseQty  || (() => {});
  const decreaseQty  = cartCtx?.decreaseQty  || (() => {});

  const heroImages = [image1, image2, image3];

  /* ── Fetch offers ─────────────────────────────────────── */
  useEffect(() => {
    getDocs(collection(db, "offers"))
      .then(snap => {
        const data = [];
        snap.forEach(doc => { if (doc.data().isActive) data.push({ id:doc.id, ...doc.data() }); });
        setOffers(data.length > 0 ? data : DEFAULT_OFFERS);
      })
      .catch(() => setOffers(DEFAULT_OFFERS));
  }, []);

  /* ── Fetch trending from all 3 menu collections ───────── */
useEffect(() => {
    (async () => {
      try {
        const COLS = [
          { col:"menu",  brand:"Shrimmers",  route:"/menu/shrimmers",  color:"#F2C35A" },
          { col:"Pmenu", brand:"Peppanizze", route:"/menu/peppanizze", color:"#FF6B5B" },
          { col:"Umenu", brand:"UrbanWrap",  route:"/menu/urbanwrap",  color:"#00D4AA" },
        ];
        let all = [];
 
        for (const { col, brand, route, color } of COLS) {
          try {
            const snap = await getDocs(collection(db, col));
            snap.forEach(doc => {
              const d = doc.data();
              (d.items || []).forEach(item => {
                if (item.name && item.price && item.isAvailable !== false) {
                  all.push({
                    ...item,
                    brand, route, color,
                    itemId: `${col}-${item.name}`.replace(/\s+/g,"_").toLowerCase(),
                    // Ensure rating is a usable number
                    rating: parseFloat(item.rating) || 0,
                  });
                }
              });
            });
          } catch (e) {
            // Collection might not exist — skip silently
            console.log(`Skipping collection ${col}:`, e.message);
          }
        }
 
        // Sort by rating descending — NO minimum filter
        // Take up to 12 items regardless of rating
        const sorted = [...all]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 12);
 
        setTrending(sorted);
      } catch (e) {
        console.log("Trending fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Hero auto-advance ────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => setSlide(p => (p+1) % heroImages.length), 5500);
    return () => clearInterval(id);
  }, []);

  /* ── AI toast ─────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => window.showAiToast?.("🔥 Trending: CHEEZY 7 PIZZA is selling fast! ₹229", 7000), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleSearch   = q => { if (q?.trim()) navigate(getRouteForQuery(q)); };
  const handleCategory = q => navigate(getRouteForQuery(q));

  const handleAdd = item => addToCart({
    id:   item.itemId,
    name: item.name,
    price:item.price,
    img:  item.img || "",
    qty:  1,
    brand:item.brand,
  });

  /* ──────────────────────────────────────────────────────── */
  return (
    <div className="home-container" ref={revealRef}>

      {/* ══ 1. HERO ══════════════════════════════════════ */}
      <section className="hero-section">

        {/* Slides */}
        <div className="hero-slides">
          {heroImages.map((img, i) => (
            <div key={i} className={`hero-slide ${i === slide ? "active" : ""}`}
              style={{ backgroundImage:`url(${img})` }} />
          ))}
        </div>

        {/* Overlay layers */}
        <div className="hero-overlay" />
        <div className="hero-noise" />

        {/* Floating food particles */}
        <div className="hero-particles" aria-hidden="true">
          {HERO_PARTICLES.map((e, i) => (
            <span key={i} className={`particle p${i+1}`}>{e}</span>
          ))}
        </div>

        {/* Main content */}
        <div className="hero-content">
          <p className="hero-eyebrow">
            <span className="eyebrow-line" />
            Cloud Kitchen · Hyderabad
          </p>

          <h1 className="hero-title">
            Fresh Flavours,
            <em>Delivered Fast.</em>
          </h1>

          <p className="hero-sub">
            Three premium brands. 52+ handcrafted dishes.
            One obsession — perfection on every plate.
          </p>

          <div className="hero-search-wrap">
            <SearchBar onSearch={handleSearch} />
          </div>

          <div className="hero-actions">
            <button className="hero-btn-primary"
              onClick={() => document.querySelector(".trending-section")?.scrollIntoView({ behavior:"smooth" })}>
              🔥 See What's Trending
            </button>
            <button className="hero-btn-ghost"
              onClick={() => document.querySelector(".brands-section")?.scrollIntoView({ behavior:"smooth" })}>
              Explore Brands →
            </button>
          </div>
        </div>

        {/* Slide dots */}
        <div className="hero-dots">
          {heroImages.map((_, i) => (
            <button key={i} className={`dot ${i === slide ? "active" : ""}`}
              onClick={() => setSlide(i)} aria-label={`Slide ${i+1}`} />
          ))}
        </div>

        {/* Scroll cue */}
        <div className="scroll-cue" aria-hidden="true">
          <div className="scroll-line" />
          <span>SCROLL</span>
        </div>
      </section>

      {/* ══ 2. STATS STRIP ═══════════════════════════════ */}
      <section className="stats-strip">
        <div className="stats-inner">
          {STATS.map((s, i) => (
            <div key={i} className="stat-item reveal" style={{ transitionDelay:`${i*0.1}s` }}>
              <span className="stat-icon">{s.icon}</span>
              <p className="stat-value">{s.value}<span className="stat-suffix">{s.suffix}</span></p>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 3. TRENDING THIS WEEK ════════════════════════ */}
      <section className="trending-section">
        <div className="section-head reveal">
          <p className="sec-eyebrow">🔥 Most Ordered</p>
          <h2 className="sec-title">Trending This Week</h2>
          <p className="sec-sub">Dishes your neighbourhood can't stop ordering</p>
        </div>

        {loading ? (
          <div className="trending-skeletons">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" />)}
          </div>
        ) : trending.length === 0 ? null : (
          <div className="trending-scroll">
            {trending.map((item, i) => {
              const qty = getItemQty(item.itemId);
              return (
                <div key={item.itemId} className="t-card reveal"
                  style={{ transitionDelay:`${i * 0.06}s` }}>

                  {/* Image */}
                  <div className="t-img-wrap" onClick={() => navigate(item.route)}>
                    {item.img
                      ? <img src={item.img} alt={item.name} className="t-img" loading="lazy" />
                      : <div className="t-img-fallback"><span>🍽️</span></div>
                    }
                    {/* Rank badge */}
                    <span className="t-rank" style={{ background: item.color }}>
                      #{i+1}
                    </span>
                    {/* Brand chip */}
                    <span className="t-brand" style={{ color: item.color }}>
                      {item.brand}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="t-info">
                    <p className="t-name">{item.name}</p>
                    <div className="t-meta">
                      <span className="t-price">₹{item.price}</span>
                      {item.rating && (
                        <span className="t-rating">⭐ {item.rating}</span>
                      )}
                    </div>
                    {/* Cart controls */}
                    {qty === 0 ? (
                      <button className="t-add" onClick={() => handleAdd(item)}>ADD +</button>
                    ) : (
                      <div className="t-qty">
                        <button onClick={() => decreaseQty(item.itemId)}>−</button>
                        <span>{qty}</span>
                        <button onClick={() => increaseQty(item.itemId)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══ 4. OUR BRANDS ════════════════════════════════ */}
      <section className="brands-section">
        <div className="section-head reveal">
          <p className="sec-eyebrow">Our Kitchen</p>
          <h2 className="sec-title">Three Brands,<em> One Standard</em></h2>
          <p className="sec-sub">Each brand crafted for a distinct, unforgettable flavour experience</p>
        </div>

        <div className="brands-grid">
          {BRAND_CONFIG.map((b, i) => (
            <div key={b.id}
              className="brand-card reveal"
              style={{ "--bc": b.color, transitionDelay:`${i*0.15}s` }}
              onClick={() => navigate(b.route)}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === "Enter" && navigate(b.route)}
            >
              <div className="brand-glow" />
              <div className="brand-top">
                <span className="brand-icon">{b.icon}</span>
                <h3 className="brand-name">{b.name}</h3>
              </div>
              <p className="brand-tagline">{b.tagline}</p>
              <p className="brand-desc">{b.desc}</p>
              <div className="brand-cta" style={{ color: b.color }}>
                Explore Menu <span className="brand-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 5. CATEGORIES ════════════════════════════════ */}
      <section className="categories-section">
        <div className="section-head reveal">
          <p className="sec-eyebrow">Quick Browse</p>
          <h2 className="sec-title">What's on<em> your mind?</em></h2>
        </div>

        <div className="categories-pills reveal">
          {FOOD_CATEGORIES.map((cat, i) => (
            <button key={cat.id}
              className="cat-pill"
              style={{ transitionDelay:`${i*0.07}s` }}
              onClick={() => handleCategory(cat.query)}
            >
              <span className="cat-emoji">{cat.emoji}</span>
              <span className="cat-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ══ 6. OFFERS ════════════════════════════════════ */}
      {offers.length > 0 && (
        <section className="offers-section">
          <div className="section-head reveal">
            <p className="sec-eyebrow">Limited Time</p>
            <h2 className="sec-title">Exclusive Offers</h2>
            <p className="sec-sub">Use codes at checkout — these won't last long</p>
          </div>

          <div className="offers-list">
            {offers.map((offer, i) => (
              <div key={offer.id}
                className={`offer-card oc-${i % 3} reveal`}
                style={{ transitionDelay:`${i*0.1}s` }}
              >
                <div className="offer-shine" />
                <div className="offer-left">
                  <span className="offer-tag">LIMITED OFFER</span>
                  <h3 className="offer-title">
                    {offer.icon && <span className="offer-icon">{offer.icon}</span>}
                    {offer.title}
                  </h3>
                  <p className="offer-desc">{offer.description}</p>
                </div>
                <div className="offer-right">
                  <p className="offer-use">USE CODE</p>
                  <strong className="offer-code">{offer.code}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ 7. REVIEWS ═══════════════════════════════════ */}
      <section className="reviews-section">
        <div className="section-head reveal">
          <p className="sec-eyebrow">Social Proof</p>
          <h2 className="sec-title">What People Say</h2>
          <p className="sec-sub">From Hyderabad foodies who order every week</p>
        </div>

        <div className="reviews-track-wrap">
          <div className="reviews-track">
            {REVIEWS.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-stars">
                  {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
                </div>
                <p className="review-text">"{r.text}"</p>
                <div className="review-footer">
                  <span className="review-name">{r.name}</span>
                  <span className="review-city">📍 {r.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. CONNECT ═══════════════════════════════════ */}
      <section className="connect-section">
        <div className="section-head reveal">
          <p className="sec-eyebrow">Get in Touch</p>
          <h2 className="sec-title">Connect With Us</h2>
          <p className="sec-sub">Custom orders, bulk enquiries, or just to say hi!</p>
        </div>

        <div className="connect-row reveal">
          <a href={`https://wa.me/917569534271?text=${encodeURIComponent("Hi BlueBliss! 🌿 I'd like to place an order.")}`}
            target="_blank" rel="noopener noreferrer"
            className="connect-card whatsapp">
            <span className="connect-icon">💬</span>
            <h3>WhatsApp</h3>
            <p>Order directly or get instant support</p>
            <span className="connect-cta">CHAT NOW</span>
          </a>

          <a href="https://www.instagram.com/shrimmers_/"
            target="_blank" rel="noopener noreferrer"
            className="connect-card instagram">
            <span className="connect-icon">📸</span>
            <h3>Instagram</h3>
            <p>Follow for drops, offers & behind-the-scenes</p>
            <span className="connect-cta">FOLLOW US</span>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
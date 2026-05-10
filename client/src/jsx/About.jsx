// src/jsx/About.jsx — BlueBliss V2.0 Premium
import React, { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./About.css";

/* ── Scroll reveal ─────────────────────────────────────────── */
function useScrollReveal() {
  const obs = useRef(null);
  return useCallback(node => {
    if (!node) return;
    obs.current?.disconnect();
    obs.current = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.current?.unobserve(e.target);
        }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    node.querySelectorAll(".reveal").forEach(el => obs.current?.observe(el));
  }, []);
}

/* ── Static data ───────────────────────────────────────────── */
const STATS = [
  { value:"4.2★", label:"Customer Rating" },
  { value:"3",    label:"Premium Brands"  },
  { value:"52+",  label:"Dishes Crafted"  },
  { value:"10K+", label:"Happy Orders"    },
];

const BRANDS = [
  {
    name:"Shrimmers",  icon:"✨", color:"#F2C35A",
    tagline:"Burgers · Shakes · Fries",
    desc:"Premium burgers built from the bun up — every ingredient chosen for flavour, texture and soul.",
    img:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  },
  {
    name:"Peppanizze", icon:"🌶️", color:"#FF6B5B",
    tagline:"Pizzas · Paneer · Spice",
    desc:"Bold, wood-fired flavours with an unmistakably Indian twist. Where Italian meets Hyderabad.",
    img:"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
  },
  {
    name:"UrbanWrap",  icon:"🌯", color:"#00D4AA",
    tagline:"Wraps · Rolls · Fresh",
    desc:"Fresh, vibrant wraps packed with premium ingredients and bursting with every bite.",
    img:"https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80",
  },
];

const VALUES = [
  { icon:"🌿", title:"100% Fresh",      desc:"Every ingredient sourced daily. No frozen shortcuts, ever." },
  { icon:"🔥", title:"Made to Order",   desc:"We cook only when you order. Always hot, always fresh." },
  { icon:"⚡", title:"Fast Delivery",   desc:"Average 30–45 min from kitchen to door, across Hyderabad." },
  { icon:"🏆", title:"Uncompromising",  desc:"Every recipe tested hundreds of times before it earns a place on our menu." },
];

const GALLERY_IMGS = [
  { src:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&q=80", alt:"Premium Burger" },
  { src:"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=700&q=80", alt:"Wood-fired Pizza" },
  { src:"https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700&q=80", alt:"Fresh Wrap"      },
  { src:"https://images.unsplash.com/photo-1550547660-d9450f859349?w=700&q=80", alt:"Crispy Fries"    },
  { src:"https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=700&q=80", alt:"Milkshake"       },
  { src:"https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=700&q=80", alt:"Food Spread"     },
];

/* ══════════════════════════════════════════════════════════ */
export default function About() {
  const navigate   = useNavigate();
  const revealRef  = useScrollReveal();

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:"smooth" });

  return (
    <div className="about-page" ref={revealRef}>

      {/* ══ 1. HERO ════════════════════════════════════════ */}
      <section className="ab-hero">
        <div className="ab-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1800&q=80"
            alt="BlueBliss food spread" className="ab-hero-img" />
          <div className="ab-hero-overlay" />
        </div>

        {/* Floating food particles */}
        <div className="ab-particles" aria-hidden>
          {["🍔","🍕","🌯","🥤","🍟","🌶️"].map((e,i) => (
            <span key={i} className={`ab-particle p${i+1}`}>{e}</span>
          ))}
        </div>

        <div className="ab-hero-content">
          <p className="ab-eyebrow">Cloud Kitchen · Hyderabad · Since 2023</p>
          <h1 className="ab-hero-title">
            We don't just
            <em>cook food.</em>
            We craft experiences.
          </h1>
          <p className="ab-hero-sub">
            Three premium brands. One obsession.
            Perfection on every plate, delivered to your door.
          </p>
          <div className="ab-hero-ctas">
            <button className="ab-btn-primary" onClick={() => navigate("/")}>
              Order Now
            </button>
            <button className="ab-btn-ghost" onClick={() => scrollTo("our-story")}>
              Our Story ↓
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="ab-scroll-cue" aria-hidden>
          <div className="ab-scroll-line" />
          <span>SCROLL</span>
        </div>
      </section>

      {/* ══ 2. STATS STRIP ═════════════════════════════════ */}
      <section className="ab-stats">
        {STATS.map((s,i) => (
          <div key={i} className="ab-stat reveal" style={{ transitionDelay:`${i*0.1}s` }}>
            <p className="ab-stat-val">{s.value}</p>
            <p className="ab-stat-lab">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ══ 3. OUR STORY ═══════════════════════════════════ */}
      <section className="ab-story" id="our-story">
        <div className="ab-story-text reveal">
          <p className="ab-section-eyebrow">Our Story</p>
          <h2 className="ab-section-title">
            Born in Hyderabad,<br />
            <em>Built on Passion</em>
          </h2>
          <p className="ab-body-p">
            BlueBliss started with one simple belief: great food shouldn't force you to
            choose between quality and speed. We launched our first kitchen in the heart
            of Padmarao Nagar with a small team of passionate cooks and an outsized dream —
            to redefine what a cloud kitchen could be.
          </p>
          <p className="ab-body-p">
            Every recipe in our menu has been tested hundreds of times. We obsessed over
            the perfect burger bun-to-patty ratio, the crispiest fries texture, the most
            flavourful pizza base — until we got it exactly right. No shortcuts.
            No compromises.
          </p>
          <p className="ab-body-p">
            Today, we operate three distinct brands under the BlueBliss umbrella —
            each with its own flavour identity, each united by our uncompromising
            commitment to quality.
          </p>
          <div className="ab-story-tags">
            {["Hyderabad-born", "FSSAI Certified", "Zomato 4.2★", "Swiggy Partner"].map((t,i) => (
              <span key={i} className="ab-tag">{t}</span>
            ))}
          </div>
        </div>

        <div className="ab-story-media reveal">
          <div className="ab-story-grid">
            <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&q=80"
              alt="Premium burger" className="ab-story-img ab-story-img-main" />
            <img src="https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&q=80"
              alt="Kitchen" className="ab-story-img ab-story-img-sm" />
            <img src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80"
              alt="Pizza" className="ab-story-img ab-story-img-sm" />
          </div>
          {/* Floating stat badge */}
          <div className="ab-story-badge">
            <span className="ab-badge-num">10K+</span>
            <span className="ab-badge-label">Happy Customers</span>
          </div>
        </div>
      </section>

      {/* ══ 4. THREE BRANDS ════════════════════════════════ */}
      <section className="ab-brands">
        <div className="ab-brands-head reveal">
          <p className="ab-section-eyebrow">Our Kitchen</p>
          <h2 className="ab-section-title">
            Three Brands,<br /><em>One Standard</em>
          </h2>
          <p className="ab-section-sub">
            Each brand was born from a different craving — but all share the same DNA: quality, soul, and flavour.
          </p>
        </div>

        <div className="ab-brands-grid">
          {BRANDS.map((b,i) => (
            <div key={i} className="ab-brand-card reveal"
              style={{ "--bc": b.color, transitionDelay:`${i*0.15}s` }}>
              <div className="ab-brand-img-wrap">
                <img src={b.img} alt={b.name} className="ab-brand-img" loading="lazy" />
                <div className="ab-brand-img-overlay" />
                <span className="ab-brand-emoji">{b.icon}</span>
              </div>
              <div className="ab-brand-info">
                <h3 className="ab-brand-name">{b.name}</h3>
                <p className="ab-brand-tagline">{b.tagline}</p>
                <p className="ab-brand-desc">{b.desc}</p>
                <button className="ab-brand-btn"
                  onClick={() => navigate(`/menu/${b.name.toLowerCase()}`)}>
                  View Menu →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 5. THE KITCHEN ═════════════════════════════════ */}
      <section className="ab-kitchen">
        <div className="ab-kitchen-media reveal">
          <img
            src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&q=80"
            alt="Our chef at work" className="ab-kitchen-img" loading="lazy" />
          <div className="ab-kitchen-badge">
            <span className="ab-kb-icon">🔥</span>
            <div>
              <p className="ab-kb-title">Cooked Fresh</p>
              <p className="ab-kb-sub">Every. Single. Order.</p>
            </div>
          </div>
        </div>

        <div className="ab-kitchen-text reveal">
          <p className="ab-section-eyebrow">Behind the Scenes</p>
          <h2 className="ab-section-title">
            Where the Magic<br /><em>Happens</em>
          </h2>
          <p className="ab-body-p">
            Our kitchen is purpose-built for speed without sacrifice. Every station
            is optimised so your food goes from prep to packaging in under 15 minutes —
            arriving at your door still hot, still perfect.
          </p>
          <p className="ab-body-p">
            We use commercial-grade equipment, maintain strict FSSAI hygiene standards,
            and conduct daily quality audits. What you order is exactly what we'd serve
            at our own table.
          </p>
          <div className="ab-kitchen-checks">
            {[
              "FSSAI Certified kitchen",
              "Daily hygiene audits",
              "Fresh ingredients sourced daily",
              "Zero frozen shortcuts",
              "Temperature-controlled packaging",
            ].map((c,i) => (
              <div key={i} className="ab-check-item">
                <span className="ab-check-icon">✓</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. VALUES ══════════════════════════════════════ */}
      <section className="ab-values">
        <div className="ab-values-head reveal">
          <p className="ab-section-eyebrow">What We Stand For</p>
          <h2 className="ab-section-title">Our Values</h2>
        </div>
        <div className="ab-values-grid">
          {VALUES.map((v,i) => (
            <div key={i} className="ab-value-card reveal" style={{ transitionDelay:`${i*0.1}s` }}>
              <span className="ab-value-icon">{v.icon}</span>
              <h3 className="ab-value-title">{v.title}</h3>
              <p className="ab-value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 7. GALLERY ═════════════════════════════════════ */}
      <section className="ab-gallery">
        <div className="ab-gallery-head reveal">
          <p className="ab-section-eyebrow">From Our Kitchen</p>
          <h2 className="ab-section-title">Every Dish<br /><em>Tells a Story</em></h2>
        </div>
        <div className="ab-gallery-grid reveal">
          {GALLERY_IMGS.map((img,i) => (
            <div key={i} className="ab-gallery-item" style={{ animationDelay:`${i*0.07}s` }}>
              <img src={img.src} alt={img.alt} loading="lazy" />
              <div className="ab-gallery-hover">
                <span>{img.alt}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 8. CTA ═════════════════════════════════════════ */}
      <section className="ab-cta reveal">
        <div className="ab-cta-inner">
          <p className="ab-section-eyebrow">Ready to Order?</p>
          <h2 className="ab-cta-title">
            Taste the<br /><em>BlueBliss Difference</em>
          </h2>
          <p className="ab-cta-sub">
            Join thousands of happy customers across Hyderabad.
            Fresh food, fast delivery, zero compromises.
          </p>
          <div className="ab-cta-btns">
            <button className="ab-btn-primary ab-cta-btn" onClick={() => navigate("/")}>
              Order Now
            </button>
            <button className="ab-btn-ghost" onClick={() => navigate("/contact")}>
              Contact Us
            </button>
          </div>
        </div>
        {/* Background food collage */}
        <div className="ab-cta-bg-imgs" aria-hidden>
          <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=60" alt="" />
          <img src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&q=60" alt="" />
          <img src="https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&q=60" alt="" />
        </div>
      </section>

    </div>
  );
}
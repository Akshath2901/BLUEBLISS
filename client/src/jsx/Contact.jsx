// src/jsx/Contact.jsx — BlueBliss V2.0
import React, { useState, useCallback, useRef } from "react";
import "./contact.css";

function useScrollReveal() {
  const obs = useRef(null);
  return useCallback(node => {
    if (!node) return;
    obs.current?.disconnect();
    obs.current = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.current?.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    node.querySelectorAll(".ct-reveal").forEach(el => obs.current?.observe(el));
  }, []);
}

const HELP_TOPICS = [
  { icon:"📦", text:"Order not delivered?" },
  { icon:"💳", text:"Payment issues?" },
  { icon:"🤝", text:"Want to collaborate?" },
  { icon:"🏪", text:"Franchise enquiries?" },
  { icon:"⭐", text:"Quality feedback?" },
  { icon:"🔄", text:"Refund request?" },
];

export default function Contact() {
  const revealRef = useScrollReveal();

  const [form, setForm]       = useState({ name:"", email:"", phone:"", subject:"", message:"" });
  const [status, setStatus]   = useState("idle"); // idle | sending | sent | error

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus("sending");
    // Simulated submission (replace with actual emailjs/firebase logic)
    await new Promise(r => setTimeout(r, 1400));
    setStatus("sent");
    setForm({ name:"", email:"", phone:"", subject:"", message:"" });
    setTimeout(() => setStatus("idle"), 5000);
  };

  const openWhatsApp = topic => {
    const msg = topic
      ? `Hi BlueBliss! I need help with: ${topic}`
      : "Hi BlueBliss! I have a query.";
    window.open(`https://wa.me/917569534271?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="contact-page" ref={revealRef}>

      {/* ══ HERO HEADER ══════════════════════════════════════════ */}
      <div className="ct-hero">
        <div className="ct-hero-inner">
          <p className="ct-eyebrow">We're here for you</p>
          <h1 className="ct-hero-title">
            Contact<br /><em>BlueBliss</em>
          </h1>
          <p className="ct-hero-sub">
            Questions, feedback, partnerships, or just want to say hi —
            we're always happy to hear from you.
          </p>
        </div>
      </div>

      {/* ══ CONTACT GRID ═════════════════════════════════════════ */}
      <section className="ct-grid-section">
        <div className="ct-grid">

          {/* LEFT — Info */}
          <div className="ct-info">

            {/* Contact cards */}
            <div className="ct-reveal">
              <p className="ct-sub-eyebrow">Get in Touch</p>
              <h2 className="ct-sub-title">We're <em>Always Available</em></h2>
            </div>

            <div className="ct-cards ct-reveal">
              <a href="https://wa.me/917569534271" target="_blank" rel="noopener noreferrer"
                className="ct-card ct-card-wa">
                <span className="ct-card-icon">💬</span>
                <div className="ct-card-body">
                  <p className="ct-card-label">WhatsApp (Fastest)</p>
                  <p className="ct-card-val">+91 75695 34271</p>
                  <p className="ct-card-hint">Avg. response: &lt; 5 min</p>
                </div>
                <span className="ct-card-arrow">→</span>
              </a>

              <a href="mailto:info@blueblissfoods.com" className="ct-card">
                <span className="ct-card-icon">📧</span>
                <div className="ct-card-body">
                  <p className="ct-card-label">Email Support</p>
                  <p className="ct-card-val">info@blueblissfoods.com</p>
                  <p className="ct-card-hint">Response within 24 hours</p>
                </div>
                <span className="ct-card-arrow">→</span>
              </a>

              <div className="ct-card">
                <span className="ct-card-icon">🕐</span>
                <div className="ct-card-body">
                  <p className="ct-card-label">Business Hours</p>
                  <p className="ct-card-val">Mon – Sun: 10 AM – 11:30 PM</p>
                  <p className="ct-card-hint">Kitchen closes 30 min before</p>
                </div>
              </div>

              <div className="ct-card">
                <span className="ct-card-icon">📍</span>
                <div className="ct-card-body">
                  <p className="ct-card-label">Kitchen Address</p>
                  <p className="ct-card-val">Padmarao Nagar, Secunderabad</p>
                  <p className="ct-card-hint">Hyderabad, Telangana 500025</p>
                </div>
              </div>
            </div>

            {/* Quick help topics */}
            <div className="ct-reveal" style={{ marginTop:32 }}>
              <p className="ct-sub-eyebrow">Quick Help</p>
              <p className="ct-help-sub">Tap a topic to open WhatsApp instantly:</p>
              <div className="ct-topics">
                {HELP_TOPICS.map((t,i) => (
                  <button key={i} className="ct-topic-btn"
                    onClick={() => openWhatsApp(t.text)}>
                    <span>{t.icon}</span>
                    <span>{t.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Form */}
          <div className="ct-form-wrap ct-reveal">
            <div className="ct-form-card">
              <p className="ct-sub-eyebrow">Send a Message</p>
              <h2 className="ct-form-title">We'll Reply <em>Personally</em></h2>

              {status === "sent" ? (
                <div className="ct-success">
                  <span className="ct-success-icon">✓</span>
                  <h3>Message Received!</h3>
                  <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  <button className="ct-success-back" onClick={() => setStatus("idle")}>
                    Send Another
                  </button>
                </div>
              ) : (
                <form className="ct-form" onSubmit={handleSubmit}>
                  <div className="ct-form-row">
                    <div className="ct-field">
                      <label>Your Name</label>
                      <input type="text" name="name" placeholder="Ravi Kumar"
                        value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="ct-field">
                      <label>Phone Number</label>
                      <input type="tel" name="phone" placeholder="+91 9876543210"
                        value={form.phone} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="ct-field">
                    <label>Email Address</label>
                    <input type="email" name="email" placeholder="you@example.com"
                      value={form.email} onChange={handleChange} required />
                  </div>

                  <div className="ct-field">
                    <label>Subject</label>
                    <input type="text" name="subject" placeholder="Order issue / Collaboration / Feedback…"
                      value={form.subject} onChange={handleChange} required />
                  </div>

                  <div className="ct-field">
                    <label>Message</label>
                    <textarea name="message" placeholder="Tell us more…" rows="5"
                      value={form.message} onChange={handleChange} required />
                    <span className="ct-char-count">{form.message.length} / 500</span>
                  </div>

                  <button type="submit" className="ct-submit" disabled={status === "sending"}>
                    {status === "sending" ? (
                      <><span className="ct-submit-spinner" /> Sending…</>
                    ) : (
                      "Send Message →"
                    )}
                  </button>

                  <p className="ct-privacy-note">
                    🔒 Your information is never shared with third parties.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ MAP ══════════════════════════════════════════════════ */}
      <section className="ct-map-section ct-reveal">
        <div className="ct-map-header">
          <p className="ct-eyebrow" style={{ textAlign:"center" }}>Find Us</p>
          <h2 className="ct-sub-title" style={{ textAlign:"center" }}>
            Our <em>Kitchen</em>
          </h2>
          <p style={{ textAlign:"center", color:"var(--ct-text-dim)", fontSize:14, maxWidth:400, margin:"0 auto 40px" }}>
            Padmarao Nagar, Secunderabad, Hyderabad — 500025
          </p>
        </div>

        <div className="ct-map-box">
          <iframe
            title="BlueBliss Kitchen Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.1506836225775!2d78.51082677516682!3d17.431720583476196!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9987e6f5e5af%3A0x3f0bdf1fa2d2e3b0!2sPadmarao%20Nagar%2C%20Secunderabad%2C%20Telangana%20500025!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
            width="100%" height="100%" style={{ border:0 }}
            allowFullScreen="" loading="lazy"
            referrerPolicy="no-referrer-when-downgrade">
          </iframe>
          <div className="ct-map-badge">
            <span>📍</span>
            <div>
              <p className="ct-map-badge-name">BlueBliss Kitchen</p>
              <p className="ct-map-badge-addr">Padmarao Nagar, Secunderabad</p>
            </div>
            <a href="https://www.google.com/maps/dir//Padmarao+Nagar,+Secunderabad,+Hyderabad"
              target="_blank" rel="noopener noreferrer" className="ct-map-badge-btn">
              Directions
            </a>
          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ═══════════════════════════════════════════ */}
      <div className="ct-bottom-cta ct-reveal">
        <p>Prefer instant help?</p>
        <button className="ct-wa-btn" onClick={() => openWhatsApp(null)}>
          💬 Chat on WhatsApp
        </button>
      </div>

    </div>
  );
}
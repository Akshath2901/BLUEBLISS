// src/jsx/profile/Help.jsx — BlueBliss V2.0
import "./profile.css";

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Go to the Order Tracking page from the navbar or bottom nav. It updates in real-time via live tracking.",
  },
  {
    q: "Can I cancel my order?",
    a: "Orders can be cancelled within 2 minutes of placing. Once confirmed by the restaurant, cancellation is not possible. For urgent issues, contact us on WhatsApp.",
  },
  {
    q: "How do loyalty points work?",
    a: "Earn points with every order — 1 point per ₹25 spent. Every 100 points unlocks a ₹400 voucher redeemable on your next order.",
  },
  {
    q: "My order was delivered but incorrect. What do I do?",
    a: "We're sorry about that! Please contact us within 1 hour of delivery on WhatsApp with your order ID and a photo. We'll resolve it immediately.",
  },
  {
    q: "Can I add special instructions?",
    a: "Yes! During checkout there's a cooking instructions field. Add allergies, spice preferences, or delivery notes there.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI (GPay, PhonePe, Paytm), credit/debit cards, and cash on delivery for select areas.",
  },
  {
    q: "How long does delivery take?",
    a: "Typically 30–60 minutes depending on your distance from the kitchen and order volume. You'll see an estimated time after placing your order.",
  },
];

export default function Help() {
  return (
    <div className="help-container">
      <h2 className="pf-section-title">Help & Support</h2>

      {/* Contact options */}
      <div className="pf-card" style={{ marginBottom:24 }}>
        <h3 className="help-section" style={{ border:"none", margin:0, padding:0 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:"var(--pf-gold)", fontStyle:"normal", letterSpacing:2, textTransform:"uppercase" }}>
            Contact Us
          </span>
        </h3>
        <p style={{ fontSize:13, color:"var(--pf-text-muted)", margin:"8px 0 18px" }}>
          We're available every day from 10 AM – 11 PM
        </p>

        <a href="https://wa.me/917569534271?text=Hi%20BlueBliss!%20I%20need%20help%20with%20my%20order."
          target="_blank" rel="noopener noreferrer"
          style={{ textDecoration:"none", display:"block" }}>
          <div className="help-contact-row">
            <span className="help-contact-icon">💬</span>
            <div>
              <p className="help-contact-label">WhatsApp (Fastest)</p>
              <p className="help-contact-value">+91 75695 34271</p>
            </div>
          </div>
        </a>

        <div className="help-contact-row">
          <span className="help-contact-icon">📧</span>
          <div>
            <p className="help-contact-label">Email</p>
            <p className="help-contact-value">support@blueblissfoods.com</p>
          </div>
        </div>

        <div className="help-contact-row">
          <span className="help-contact-icon">📍</span>
          <div>
            <p className="help-contact-label">Kitchen Address</p>
            <p className="help-contact-value">Padmarao Nagar, Secunderabad, Hyderabad — 500061</p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="help-section pf-card">
        <h3>Frequently Asked Questions</h3>
        {FAQS.map((faq, i) => (
          <div key={i} className="faq-item">
            <h4>Q: {faq.q}</h4>
            <p>{faq.a}</p>
          </div>
        ))}
      </div>

      {/* Refund policy */}
      <div className="pf-card">
        <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:2, color:"var(--pf-gold)", margin:"0 0 14px" }}>
          REFUND POLICY
        </p>
        <p style={{ fontSize:13, color:"var(--pf-text-dim)", lineHeight:1.7, margin:0 }}>
          Refunds for incorrect or missing items are processed within 24–48 hours to your original payment method.
          For cash on delivery orders, refunds are issued as loyalty points or vouchers.
          We do not accept refunds for orders where preferences were not communicated at checkout.
        </p>
      </div>
    </div>
  );
}
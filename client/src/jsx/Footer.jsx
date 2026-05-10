// src/jsx/Footer.jsx — BlueBliss V2.0 Premium Footer
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Footer.css";

const BRANDS = [
  { name: "Shrimmers",  icon: "✨", route: "/menu/shrimmers"  },
  { name: "Peppanizze", icon: "🌶️", route: "/menu/peppanizze" },
  { name: "UrbanWrap",  icon: "🌯", route: "/menu/urbanwrap"  },
];

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-wrap">

        {/* ── TOP ──────────────────────────────────────────── */}
        <div className="footer-top">

          {/* Brand side */}
          <div className="footer-brand">
            <p className="footer-logo">
              bluebliss <span className="footer-gem">✦</span>
            </p>
            <p className="footer-tagline">
              Three kitchens. One city.<br />Infinite cravings.
            </p>
            <p className="footer-city">
              <span className="footer-pin">📍</span>
              Padmarao Nagar, Hyderabad
            </p>

            {/* Social */}
            <div className="footer-socials">
              <a
                href="https://www.instagram.com/shrimmers_/"
                target="_blank" rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram" />
              </a>
              <a
                href={`https://wa.me/917569534271?text=${encodeURIComponent("Hi BlueBliss! 🌿")}`}
                target="_blank" rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="WhatsApp"
              >
                <i className="fab fa-whatsapp" />
              </a>
              <a
                href="#"
                className="footer-social-btn"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f" />
              </a>
            </div>
          </div>

          {/* Links side */}
          <div className="footer-links-wrap">
            <div className="footer-col">
              <p className="footer-col-head">Company</p>
              <ul>
                <li><button onClick={() => navigate("/about")}>About Us</button></li>
                <li><button onClick={() => navigate("/contact")}>Contact</button></li>
                <li><button>Careers</button></li>
                <li><button>Blog</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <p className="footer-col-head">Support</p>
              <ul>
                <li><button>FAQs</button></li>
                <li><button>Privacy Policy</button></li>
                <li><button>Terms & Conditions</button></li>
                <li><button>Refund Policy</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <p className="footer-col-head">Our Brands</p>
              <ul>
                {BRANDS.map(b => (
                  <li key={b.name}>
                    <button onClick={() => navigate(b.route)}>
                      {b.icon} {b.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── DIVIDER ──────────────────────────────────────── */}
        <div className="footer-divider" />

        {/* ── BOTTOM ───────────────────────────────────────── */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {year} BlueBliss Foods & Technologies. All rights reserved.
          </p>
          <p className="footer-made">
            Crafted with <span className="footer-heart">❤️</span> in Hyderabad, India
          </p>
        </div>

      </div>
    </footer>
  );
}
import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Top Section */}
        <div className="footer-top">
          <div className="footer-brand">
            <h2 className="footer-logo">BlueBliss Foods & Technologies</h2>
            <p className="footer-tagline">
              Bringing happiness through every bite 🍴
            </p>
          </div>

          <div className="footer-links">
            <div>
              <h4>Company</h4>
              <ul>
                <li>About Us</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4>Support</h4>
              <ul>
                <li>FAQs</li>
                <li>Privacy Policy</li>
                <li>Terms & Conditions</li>
              </ul>
            </div>
            <div>
              <h4>Our Brands</h4>
              <ul>
                <li>Shrimmers</li>
                <li>Peppanizze</li>
                <li>UrbanWrap</li>
              </ul>
            </div>
          </div>

          <div className="footer-social">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p>© 2025 BlueBliss Foods & Technologies. All rights reserved.</p>
          <p>Crafted with ❤️ by BlueBliss Team</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

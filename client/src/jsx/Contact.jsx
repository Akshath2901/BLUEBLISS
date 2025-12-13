import React from "react";
import "./contact.css"; // Make sure to create and link this

function Contact() {
  return (
    <div className="contact-page">

      {/* Header Section */}
      <div className="contact-header">
        <h1>Contact <span>BlueBliss Foods</span></h1>
        <p>We’re here to help you with orders, feedback, and support.</p>
      </div>

      {/* Contact Grid */}
      <div className="contact-grid">

        {/* Left - Contact Details */}
        <div className="contact-info">
          <h2>Get in Touch</h2>

          <div className="contact-card">
            <h3>Email Support</h3>
            <p>info@blueblissfoods.com</p>
          </div>

          <div className="contact-card">
            <h3>Phone</h3>
            <p>+91 98765 43210</p>
          </div>

          <div className="contact-card">
            <h3>Business Hours</h3>
            <p>Mon – Sun: 10:00 AM – 11:30 PM</p>
          </div>

          <div className="contact-help-section">
            <h2>Need Help?</h2>
            <ul>
              <li>Order not delivered?</li>
              <li>Payment issues?</li>
              <li>Want to collaborate?</li>
              <li>Franchise enquiries?</li>
              <li>Quality feedback?</li>
            </ul>
          </div>

        </div>

        {/* Right - Contact Form */}
        <div className="contact-form-container">
          <h2>Send Us a Message</h2>

          <form className="contact-form">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Email Address" required />
            <input type="text" placeholder="Phone Number" required />
            <textarea placeholder="Write your message..." required></textarea>
            <button type="submit">Submit Message</button>
          </form>
        </div>
      </div>

      {/* MAP SECTION */}
      <div className="map-section">
        <h2>Find Us</h2>
        <div className="map-box">
          <p>Google Map will be displayed here</p>
        </div>
      </div>

    </div>
  );
}

export default Contact;

import React, { useState } from "react";
import "./FloatingButtons.css";

function FloatingButtons() {
  const [expanded, setExpanded] = useState(false);

  const whatsappNumber = "917569534271";
  const whatsappMessage = encodeURIComponent(
    "Hi BlueBliss! 🌿 I'd like to know more about your menu and offers."
  );
  const instagramLink = "https://www.instagram.com/shrimmers_/";

  return (
    <div className="floating-buttons">
      {expanded && (
        <div className="floating-options">
          <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="floating-option whatsapp" title="Chat on WhatsApp">
            <span className="floating-option-icon">💬</span>
            <span className="floating-option-label">WhatsApp</span>
          </a>

          <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="floating-option instagram" title="Follow on Instagram">
            <span className="floating-option-icon">📸</span>
            <span className="floating-option-label">Instagram</span>
          </a>
        </div>
      )}

      <button
        className={`floating-main-btn ${expanded ? "active" : ""}`}
        onClick={() => setExpanded(!expanded)}
        aria-label="Connect with us"
      >
        {expanded ? "✕" : "💬"}
      </button>
    </div>
  );
}

export default FloatingButtons;
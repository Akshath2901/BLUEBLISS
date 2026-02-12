import React, { useState } from "react";
import "./GoogleReviewCard.css";

function GoogleReviewCard() {
  const [step, setStep] = useState(1); // 1=select brand, 2=review & upload, 3=done
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const brands = [
    {
      name: "Shrimmers",
      icon: "✨",
      link: "https://maps.app.goo.gl/g2p6nEzS87kA4NJq7",
    },
    {
      name: "Peppanizze",
      icon: "🌶️",
      link: "https://maps.app.goo.gl/VkA76uMp7oLzrkbo6",
    },
    {
      name: "UrbanWrap",
      icon: "🌯",
      link: "https://maps.app.goo.gl/MN4s1jcSLhpbtCgS9",
    },
  ];

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setStep(2);
  };

  const handleOpenReview = () => {
    window.open(selectedBrand.link, "_blank");
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
    }
  };

  const handleSubmit = () => {
    if (screenshot) {
      setSubmitted(true);
      setStep(3);
      // TODO: Later — send screenshot to Firebase for admin verification
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedBrand(null);
    setScreenshot(null);
    setSubmitted(false);
  };

  return (
    <div className="google-review-card">
      <div className="review-card-glow" />

      <div className="review-card-header">
        <span className="review-card-badge">⭐ REVIEW & SAVE</span>
        <h3 className="review-card-title">
          Get <span className="review-highlight">10% OFF</span> your next order!
        </h3>
        <p className="review-card-subtitle">
          Post a Google review & share a screenshot to claim your discount
        </p>
      </div>

      {/* STEP 1 — SELECT BRAND */}
      {step === 1 && (
        <div className="review-step">
          <p className="review-step-label">Step 1: Which brand did you visit?</p>
          <div className="review-brand-options">
            {brands.map((brand) => (
              <button
                key={brand.name}
                className="review-brand-btn"
                onClick={() => handleBrandSelect(brand)}
              >
                <span className="review-brand-icon">{brand.icon}</span>
                <span className="review-brand-name">{brand.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 — REVIEW & UPLOAD */}
      {step === 2 && (
        <div className="review-step">
          <div className="review-selected-brand">
            <span>{selectedBrand.icon} {selectedBrand.name}</span>
            <button className="review-change-btn" onClick={handleReset}>Change</button>
          </div>

          <p className="review-step-label">Step 2: Post your review</p>
          <button className="review-google-btn" onClick={handleOpenReview}>
            ⭐ Write a Review on Google
          </button>

          <p className="review-step-label" style={{ marginTop: "16px" }}>
            Step 3: Upload screenshot
          </p>
          <label className="review-upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              hidden
            />
            {screenshot ? (
              <div className="review-upload-success">
                <span>✅</span>
                <span>{screenshot.name}</span>
              </div>
            ) : (
              <div className="review-upload-placeholder">
                <span>📸</span>
                <span>Tap to upload screenshot</span>
              </div>
            )}
          </label>

          <button
            className={`review-submit-btn ${screenshot ? "active" : ""}`}
            onClick={handleSubmit}
            disabled={!screenshot}
          >
            Submit & Claim 10% OFF
          </button>
        </div>
      )}

      {/* STEP 3 — DONE */}
      {step === 3 && (
        <div className="review-step review-done">
          <div className="review-done-icon">🎉</div>
          <h4 className="review-done-title">Thank you!</h4>
          <p className="review-done-text">
            Your review is being verified. You'll receive your
            <strong> 10% discount code </strong> 
            within 24 hours!
          </p>
          <button className="review-done-btn" onClick={handleReset}>
            Submit Another Review
          </button>
        </div>
      )}
    </div>
  );
}

export default GoogleReviewCard;
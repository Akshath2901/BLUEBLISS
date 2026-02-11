// /src/jsx/profile/RateOrder.jsx
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import "./profile.css";

export default function RateOrder({ orderData, onBack }) {
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [review, setReview] = useState("");
  const [complaint, setComplaint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!orderData) {
    return (
      <div className="profile-container">
        <p>No order selected</p>
        <button onClick={onBack}>Back to Orders</button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (stars === 0) {
      alert("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderRef = doc(db, "orders", orderData.orderDocId);
      await updateDoc(orderRef, {
        rating: {
          stars,
          review: review.trim(),
          complaint: complaint.trim(),
          createdAt: new Date(),
        },
      });

      alert("Thank you for your feedback! 🎉");
      onBack(); // Go back to orders
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rate-order-container">
      <div className="rate-order-card">
        <h2>Rate Your Order</h2>
        {orderData.orderId && <p className="order-subtitle">Order #{orderData.orderId}</p>}

        {/* Star Rating */}
        <div className="star-rating-section">
          <p className="rating-question">How was your food?</p>
          <div className="stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= (hoverStars || stars) ? "active" : ""}`}
                onClick={() => setStars(star)}
                onMouseEnter={() => setHoverStars(star)}
                onMouseLeave={() => setHoverStars(0)}
              >
                ★
              </span>
            ))}
          </div>
          {stars > 0 && (
            <p className="rating-label">
              {stars === 1 && "Poor"}
              {stars === 2 && "Fair"}
              {stars === 3 && "Good"}
              {stars === 4 && "Very Good"}
              {stars === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Review */}
        <div className="form-group">
          <label htmlFor="review">Share your experience (optional)</label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell us what you loved or what could be better..."
            maxLength={500}
          />
          <p className="char-count">{review.length}/500 characters</p>
        </div>

        {/* Complaint */}
        <div className="form-group">
          <label htmlFor="complaint">Any issues? (optional)</label>
          <textarea
            id="complaint"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Let us know if something went wrong..."
            maxLength={300}
          />
          <p className="char-count">{complaint.length}/300 characters</p>
        </div>

        {/* Action Buttons */}
        <div className="button-group">
          <button
            className="btn-secondary"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || stars === 0}
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
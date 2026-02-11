// client/src/components/OfferBanner.jsx
import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import "./OfferBanner.css";

export default function OfferBanner() {

  const [offers, setOffers] = useState([]);
  const [currentOffer, setCurrentOffer] = useState(0);
  const navigate = useNavigate();

  // 🔥 FETCH OFFERS FROM FIREBASE
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offersSnapshot = await getDocs(collection(db, "offers"));
        const offersData = [];
        
        offersSnapshot.forEach((doc) => {
          // Only active offers
          if (doc.data().isActive) {
            offersData.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        
        setOffers(offersData);
        console.log("✅ Navbar offers loaded:", offersData);
      } catch (e) {
        console.log("Error fetching navbar offers:", e);
      }
    };

    fetchOffers();
  }, []);

  // Auto-rotate offers
  useEffect(() => {
    if (offers.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 5000); // Change every 5 seconds
    
    return () => clearInterval(interval);
  }, [offers.length]);

  // Handle click - Navigate to menu
  const handleOfferClick = () => {
    const offer = offers[currentOffer];
    if (offer.route) {
      navigate(offer.route);
    }
  };

  if (offers.length === 0) return null;

  const currentOfferData = offers[currentOffer];

  return (
    <div
      className="offer-banner"
      onClick={handleOfferClick}
      style={{ cursor: "pointer" }}
    >
      <div className="offer-banner-content">
        {/* Icon */}
        <span className="offer-icon">{currentOfferData.icon || "🎁"}</span>

        {/* Text */}
        <div className="offer-text">
          <p className="offer-title">{currentOfferData.title}</p>
          <p className="offer-code">Code: {currentOfferData.code}</p>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="offer-dots">
        {offers.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === currentOffer ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentOffer(idx);
            }}
            aria-label={`Go to offer ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
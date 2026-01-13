import React, { useContext } from "react";
import { LoyaltyContext } from "../context/LoyaltyContext";
import "./LoyaltyPointsDisplay.css";

export default function LoyaltyPointsDisplay() {
  const { loyaltyData } = useContext(LoyaltyContext);

  if (!loyaltyData) return null;

  const currentPoints = loyaltyData.totalPoints % 100;
  const pointsToVoucher = 100 - currentPoints;
  const vouchersEarned = Math.floor(loyaltyData.totalPoints / 100);

  return (
    <div className="loyalty-display">
      <div className="points-card">
        <h3>🎁 Your Rewards</h3>
        
        <div className="points-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentPoints / 100) * 100}%` }}
            ></div>
          </div>
          <p className="points-text">
            {currentPoints} / 100 points
          </p>
        </div>
        
        <p className="points-hint">
          {pointsToVoucher} points to unlock ₹400 voucher!
        </p>
        
        {vouchersEarned > 0 && (
          <div className="vouchers-section">
            <h4>Available Vouchers: {vouchersEarned}</h4>
            <p className="voucher-hint">Use in your next order!</p>
          </div>
        )}
      </div>
    </div>
  );
}
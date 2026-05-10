// src/jsx/LoyaltyPointsDisplay.jsx
import React, { useContext } from "react";
import { LoyaltyContext } from "../context/LoyaltyContext";
import { VOUCHER_CONFIG, pointsToNextReward, rewardProgress } from "../utils/loyaltyPoints";

export default function LoyaltyPointsDisplay() {
  const { loyaltyData } = useContext(LoyaltyContext);
  if (!loyaltyData) return null;

  // Use currentPoints (0–100 cycle) — falls back to totalPoints % 100 for old data
  const currentPoints = loyaltyData.currentPoints ??
    (loyaltyData.totalPoints % VOUCHER_CONFIG.pointsPerVoucher);

  const toNext    = pointsToNextReward(currentPoints);
  const progress  = rewardProgress(currentPoints);

  const availableRewards = loyaltyData.unlockedVouchers?.filter(
    v => v.status === "available" && new Date(v.expiryDate) > new Date()
  ).length || 0;

  // Green banner when reward is ready
  if (availableRewards > 0) {
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        background:"linear-gradient(135deg,rgba(76,175,80,0.12),rgba(76,175,80,0.06))",
        border:"1px solid rgba(76,175,80,0.35)", borderRadius:10,
        padding:"10px 14px", marginBottom:10,
      }}>
        <span style={{ fontSize:22 }}>🎁</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:13, fontWeight:800, color:"#4caf50", margin:0 }}>
            Free Combo Reward ready!
          </p>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:"2px 0 0" }}>
            {VOUCHER_CONFIG.rewardDescription} · Apply below ↓
          </p>
        </div>
        <span style={{
          background:"#4caf50", color:"#fff", fontSize:10, fontWeight:900,
          padding:"3px 8px", borderRadius:20, textTransform:"uppercase",
          letterSpacing:"0.3px", whiteSpace:"nowrap",
        }}>
          {availableRewards} available
        </span>
      </div>
    );
  }

  // Slim progress bar otherwise
  return (
    <div style={{
      background:"rgba(28,28,28,0.6)", border:"1px solid rgba(212,175,55,0.15)",
      borderRadius:10, padding:"10px 14px", marginBottom:10,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:18 }}>⭐</span>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:5 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#ffd700" }}>
              {currentPoints} / 100 pts
            </span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>
              {toNext} more → 🍔 Free Combo
            </span>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,0.08)",
            borderRadius:4, overflow:"hidden" }}>
            <div style={{
              height:"100%", width:`${progress}%`,
              background:"linear-gradient(90deg,#d4af37,#ffd700)",
              borderRadius:4, transition:"width 0.6s ease",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
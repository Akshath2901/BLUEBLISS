// src/jsx/profile/LoyaltyRewardsSection.jsx — BlueBliss V2.0
import React, { useContext, useState } from "react";
import { LoyaltyContext } from "../../context/LoyaltyContext";
import "./profile.css";

export default function LoyaltyRewardsSection() {
  const { loyaltyData }         = useContext(LoyaltyContext);
  const [copiedId, setCopiedId] = useState(null);

  if (!loyaltyData) return (
    <div className="loyalty-page">
      <div className="loyalty-inner">
        <p style={{ textAlign:"center", padding:"40px", color:"var(--pf-text-muted)" }}>
          Loading your rewards…
        </p>
      </div>
    </div>
  );

  const currentPoints      = loyaltyData.totalPoints % 100;
  const pointsToNext       = 100 - currentPoints;
  const progressPct        = (currentPoints / 100) * 100;
  const availableVouchers  = loyaltyData.unlockedVouchers?.filter(v => v.status === "available") || [];
  const historyReversed    = (loyaltyData.pointsHistory || []).slice().reverse();

  const handleCopy = id => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  return (
    <div className="loyalty-page">
      <div className="loyalty-inner">

        {/* ── Hero ── */}
        <div className="loyalty-hero">
          <h1 className="loyalty-title">🎁 My Rewards</h1>
          <p className="loyalty-subtitle">Unlock premium vouchers with every order</p>
        </div>

        {/* ── Points Card ── */}
        <div className="loyalty-points-card">

          <div className="loyalty-points-row">
            <h2 className="loyalty-points-heading">Loyalty Points</h2>
            <div className="loyalty-points-badge">⭐ {loyaltyData.totalPoints}</div>
          </div>

          {/* Progress bar — width is data-driven, justified inline */}
          <div className="loyalty-progress-track">
            <div className="loyalty-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="loyalty-stats-grid">
            <div className="loyalty-stat-box">
              <p className="loyalty-stat-box-label">Current Progress</p>
              <p className="loyalty-stat-box-val">{currentPoints}/100</p>
            </div>
            <div className="loyalty-stat-box">
              <p className="loyalty-stat-box-label">Points to Next Voucher</p>
              <p className="loyalty-stat-box-val orange">{pointsToNext}</p>
            </div>
          </div>

          <div className="loyalty-next-banner">
            <p className="loyalty-next-label">Next Reward Unlocked</p>
            <p className="loyalty-next-amount">₹400 Voucher</p>
          </div>
        </div>

        {/* ── Available Vouchers ── */}
        {availableVouchers.length > 0 && (
          <div className="vouchers-section">
            <h2 className="vouchers-title">🎟️ Available Vouchers ({availableVouchers.length})</h2>
            <div className="vouchers-grid">
              {availableVouchers.map(voucher => (
                <div key={voucher.voucherId} className="voucher-card">
                  <div className="voucher-deco" />

                  <div className="voucher-amount-banner">
                    <p className="voucher-amount-tag">DISCOUNT VOUCHER</p>
                    <p className="voucher-amount-num">₹{voucher.amount}</p>
                  </div>

                  <div className="voucher-code-box">
                    <p className="voucher-code-tag">VOUCHER CODE</p>
                    <p className="voucher-code-val">{voucher.voucherId}</p>
                  </div>

                  <p className="voucher-validity">
                    Valid till{" "}
                    <span>{new Date(voucher.expiryDate).toLocaleDateString("en-IN")}</span>
                  </p>

                  <button
                    className={`voucher-copy-btn ${copiedId === voucher.voucherId ? "copied" : ""}`}
                    onClick={() => handleCopy(voucher.voucherId)}>
                    {copiedId === voucher.voucherId ? "✓ Copied!" : "📋 Copy & Use"}
                  </button>

                  <p className="voucher-hint">Click to copy and use at checkout</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── No vouchers ── */}
        {availableVouchers.length === 0 && (
          <div className="no-vouchers-card">
            <p>🎯</p>
            <h3>No Vouchers Yet</h3>
            <p>Earn {pointsToNext} more points to unlock your first ₹400 voucher!</p>
          </div>
        )}

        {/* ── Points History ── */}
        {historyReversed.length > 0 && (
          <div className="history-section">
            <h2 className="history-title">📊 Points History</h2>
            <div className="history-card">
              {historyReversed.map((entry, i) => (
                <div key={i} className="history-row">
                  <div>
                    <p className="history-order">Order {entry.orderId}</p>
                    <p className="history-date">
                      {new Date(entry.date?.toDate?.() || entry.date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <p className={`history-pts ${entry.type === "earned" ? "earned" : "spent"}`}>
                    {entry.type === "earned" ? "+" : "−"}{entry.points}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
import React, { useContext, useState } from "react";
import { LoyaltyContext } from "../../context/LoyaltyContext";

export default function LoyaltyRewardsSection() {
  const { loyaltyData } = useContext(LoyaltyContext);
  const [copiedVoucherId, setCopiedVoucherId] = useState(null);

  if (!loyaltyData)
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
        <p>Loading your rewards...</p>
      </div>
    );

  const currentPoints = loyaltyData.totalPoints % 100;
  const vouchersEarned = Math.floor(loyaltyData.totalPoints / 100);
  const pointsToNextVoucher = 100 - currentPoints;

  const handleCopyVoucher = (voucherId) => {
    navigator.clipboard.writeText(voucherId);
    setCopiedVoucherId(voucherId);
    setTimeout(() => setCopiedVoucherId(null), 2000);
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f0e09 0%, #1a1a1a 100%)",
        minHeight: "100vh",
        padding: "40px 20px",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 50, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 900,
              background: "linear-gradient(135deg, #ffd700, #d4af37)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: "0 0 10px 0",
            }}
          >
            🎁 My Rewards
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Unlock premium vouchers with every order
          </p>
        </div>

        {/* POINTS PROGRESS SECTION */}
        <div
          style={{
            background: "linear-gradient(135deg, #1c1c1c 0%, #262626 100%)",
            borderRadius: 24,
            padding: 40,
            marginBottom: 40,
            border: "2px solid rgba(212, 175, 55, 0.2)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Points Display */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }}>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  margin: 0,
                  color: "#fff",
                }}
              >
                Loyalty Points
              </h2>
              <div
                style={{
                  background: "linear-gradient(135deg, #ffd700, #d4af37)",
                  padding: "10px 20px",
                  borderRadius: 12,
                  color: "#000",
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                ⭐ {loyaltyData.totalPoints}
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                background: "#111",
                borderRadius: 12,
                padding: 3,
                height: 14,
                overflow: "hidden",
                marginBottom: 20,
                border: "1px solid rgba(212, 175, 55, 0.2)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #ffd700, #d4af37)",
                  width: `${(currentPoints / 100) * 100}%`,
                  borderRadius: 10,
                  transition: "width 0.5s ease",
                  boxShadow: "0 0 15px rgba(212, 175, 55, 0.4)",
                }}
              />
            </div>

            {/* Points Info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 15,
              }}
            >
              <div
                style={{
                  background: "#111",
                  padding: 15,
                  borderRadius: 12,
                  textAlign: "center",
                  border: "1px solid rgba(212, 175, 55, 0.15)",
                }}
              >
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 5px 0" }}>
                  Current Progress
                </p>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#ffd700",
                    margin: 0,
                  }}
                >
                  {currentPoints}/100
                </p>
              </div>

              <div
                style={{
                  background: "#111",
                  padding: 15,
                  borderRadius: 12,
                  textAlign: "center",
                  border: "1px solid rgba(212, 175, 55, 0.15)",
                }}
              >
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 5px 0" }}>
                  Points to Next Voucher
                </p>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#ff9800",
                    margin: 0,
                  }}
                >
                  {pointsToNextVoucher}
                </p>
              </div>
            </div>
          </div>

          {/* Voucher Preview */}
          <div
            style={{
              background: "linear-gradient(135deg, #ffd700, #d4af37)",
              borderRadius: 16,
              padding: 20,
              color: "#000",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 13, margin: "0 0 5px 0", fontWeight: 600 }}>
              Next Reward Unlocked
            </p>
            <p
              style={{
                fontSize: 32,
                fontWeight: 900,
                margin: 0,
              }}
            >
              ₹400 Voucher
            </p>
          </div>
        </div>

        {/* AVAILABLE VOUCHERS SECTION */}
        {loyaltyData.unlockedVouchers.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 20,
                color: "#fff",
              }}
            >
              🎟️ Available Vouchers ({vouchersEarned})
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 20,
              }}
            >
              {loyaltyData.unlockedVouchers
                .filter((v) => v.status === "available")
                .map((voucher) => (
                  <div
                    key={voucher.voucherId}
                    style={{
                      background: "linear-gradient(135deg, #1c1c1c 0%, #262626 100%)",
                      borderRadius: 20,
                      padding: 25,
                      border: "2px solid rgba(212, 175, 55, 0.3)",
                      boxShadow: "0 10px 40px rgba(212, 175, 55, 0.1)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 20px 60px rgba(212, 175, 55, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 10px 40px rgba(212, 175, 55, 0.1)";
                    }}
                  >
                    {/* Decorative Background */}
                    <div
                      style={{
                        position: "absolute",
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        background: "radial-gradient(circle, rgba(212, 175, 55, 0.1), transparent)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Voucher Amount */}
                    <div
                      style={{
                        background: "linear-gradient(135deg, #ffd700, #d4af37)",
                        padding: 20,
                        borderRadius: 16,
                        textAlign: "center",
                        marginBottom: 20,
                        color: "#000",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          margin: "0 0 8px 0",
                        }}
                      >
                        DISCOUNT VOUCHER
                      </p>
                      <p
                        style={{
                          fontSize: 42,
                          fontWeight: 900,
                          margin: 0,
                        }}
                      >
                        ₹{voucher.amount}
                      </p>
                    </div>

                    {/* Voucher ID */}
                    <div
                      style={{
                        background: "#111",
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 15,
                        textAlign: "center",
                        border: "1px dashed rgba(212, 175, 55, 0.3)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.5)",
                          margin: "0 0 5px 0",
                        }}
                      >
                        VOUCHER CODE
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#ffd700",
                          margin: 0,
                          fontFamily: "monospace",
                          letterSpacing: 1,
                        }}
                      >
                        {voucher.voucherId}
                      </p>
                    </div>

                    {/* Validity */}
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.6)",
                        margin: "15px 0",
                        textAlign: "center",
                      }}
                    >
                      Valid till{" "}
                      <span style={{ color: "#ffd700", fontWeight: 600 }}>
                        {new Date(voucher.expiryDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </span>
                    </p>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyVoucher(voucher.voucherId)}
                      style={{
                        width: "100%",
                        padding: 14,
                        background:
                          copiedVoucherId === voucher.voucherId
                            ? "#4caf50"
                            : "linear-gradient(135deg, #ffd700, #d4af37)",
                        border: "none",
                        borderRadius: 12,
                        color: "#000",
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        marginBottom: 10,
                      }}
                      onMouseEnter={(e) => {
                        if (copiedVoucherId !== voucher.voucherId) {
                          e.target.style.transform = "scale(1.02)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      {copiedVoucherId === voucher.voucherId
                        ? "✓ Copied!"
                        : "📋 Copy & Use"}
                    </button>

                    {/* Info */}
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      Click to copy code
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* NO VOUCHERS MESSAGE */}
        {loyaltyData.unlockedVouchers.filter((v) => v.status === "available").length === 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #1c1c1c 0%, #262626 100%)",
              borderRadius: 20,
              padding: 40,
              textAlign: "center",
              border: "2px dashed rgba(212, 175, 55, 0.3)",
              marginBottom: 40,
            }}
          >
            <p style={{ fontSize: 48, margin: "0 0 15px 0" }}>🎯</p>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px 0" }}>
              No Vouchers Yet
            </h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0 }}>
              Earn {pointsToNextVoucher} more points to unlock your first ₹400 voucher!
            </p>
          </div>
        )}

        {/* POINTS HISTORY SECTION */}
        {loyaltyData.pointsHistory && loyaltyData.pointsHistory.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 20,
                color: "#fff",
              }}
            >
              📊 Points History
            </h2>

            <div
              style={{
                background: "linear-gradient(135deg, #1c1c1c 0%, #262626 100%)",
                borderRadius: 20,
                padding: 25,
                border: "2px solid rgba(212, 175, 55, 0.2)",
              }}
            >
              {loyaltyData.pointsHistory
                .slice()
                .reverse()
                .map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 15,
                      borderBottom:
                        idx !==
                        loyaltyData.pointsHistory.length - 1
                          ? "1px solid rgba(212, 175, 55, 0.1)"
                          : "none",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          margin: "0 0 5px 0",
                          color: "#fff",
                        }}
                      >
                        Order {entry.orderId}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          margin: 0,
                        }}
                      >
                        {new Date(entry.date?.toDate?.() || entry.date).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        margin: 0,
                        color:
                          entry.type === "earned" ? "#4caf50" : "#ff5252",
                      }}
                    >
                      {entry.type === "earned" ? "+" : "-"}
                      {entry.points}
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
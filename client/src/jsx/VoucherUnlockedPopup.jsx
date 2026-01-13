import React from "react";

export default function VoucherUnlockedPopup({
  isOpen,
  onClose,
  voucherAmount = 0,
  earnedPoints = 0,
  vouchersUnlocked = 0,
}) {
  if (!isOpen) return null;

  const hasUnlockedVoucher = vouchersUnlocked > 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.3s ease-in",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1c1c1c, #0f0e09)",
          borderRadius: 20,
          padding: 40,
          maxWidth: 400,
          textAlign: "center",
          border: "2px solid #d4af37",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
          animation: "slideUp 0.4s ease-out",
          color: "#fff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: 60,
            marginBottom: 20,
            animation: "bounce 0.6s ease-in-out infinite",
          }}
        >
          {hasUnlockedVoucher ? "🎉" : "⭐"}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            background: "linear-gradient(135deg, #ffd700, #d4af37)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 10,
            margin: "0 0 10px 0",
          }}
        >
          {hasUnlockedVoucher ? "🎁 Voucher Unlocked!" : "✨ Points Earned!"}
        </h2>

        {/* Points Section */}
        <div
          style={{
            background: "#111",
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            border: "1px solid rgba(212, 175, 55, 0.2)",
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: "rgba(255, 255, 255, 0.7)",
              margin: "0 0 8px 0",
            }}
          >
            Points Earned
          </p>
          <p
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#ffd700",
              margin: 0,
            }}
          >
            +{earnedPoints}
          </p>
        </div>

        {/* Voucher Section (if unlocked) */}
        {hasUnlockedVoucher && (
          <div
            style={{
              background: "linear-gradient(135deg, #ffd700, #d4af37)",
              padding: 20,
              borderRadius: 12,
              marginBottom: 20,
              color: "#000",
              boxShadow: "0 8px 20px rgba(212, 175, 55, 0.3)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                margin: "0 0 8px 0",
                fontWeight: 600,
              }}
            >
              VOUCHER UNLOCKED
            </p>
            <p
              style={{
                fontSize: 36,
                fontWeight: 900,
                margin: "0 0 8px 0",
              }}
            >
              ₹{voucherAmount}
            </p>
            <p
              style={{
                fontSize: 12,
                margin: 0,
                opacity: 0.8,
              }}
            >
              Use this voucher on your next order!
            </p>
          </div>
        )}

        {/* Message */}
        <p
          style={{
            fontSize: 14,
            color: "rgba(255, 255, 255, 0.8)",
            margin: "20px 0",
            lineHeight: 1.5,
          }}
        >
          {hasUnlockedVoucher
            ? `You've earned ${earnedPoints} points and unlocked a ₹${voucherAmount} voucher!`
            : `Keep earning! You need ${100 - (earnedPoints % 100)} more points to unlock a ₹400 voucher.`}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: 14,
            background: "linear-gradient(135deg, #ffd700, #d4af37)",
            border: "none",
            borderRadius: 10,
            color: "#000",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          Awesome! 🎉
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
      `}</style>
    </div>
  );
}
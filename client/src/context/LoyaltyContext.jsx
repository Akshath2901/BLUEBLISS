// src/context/LoyaltyContext.jsx
// ✅ KEY BEHAVIOR:
//   - Points stored as `currentPoints` (0–99), resets to 0 when reward unlocked
//   - `totalPoints` kept only for display history (optional)
//   - When voucher is used → currentPoints resets to 0

import React, { createContext, useState, useCallback, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { calculatePoints, VOUCHER_CONFIG } from "../utils/loyaltyPoints";

export const LoyaltyContext = createContext();

const DEFAULT_LOYALTY = {
  currentPoints:    0,   // ← the 0–100 cycle counter (resets on reward)
  totalPoints:      0,   // ← lifetime points (never resets, just for history)
  unlockedVouchers: [],
  pointsHistory:    [],
};

export function LoyaltyProvider({ children }) {
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().loyaltyData) {
          const data = snap.data().loyaltyData;
          // Back-compat: if old data has no currentPoints, derive it
          if (data.currentPoints === undefined) {
            data.currentPoints = data.totalPoints % VOUCHER_CONFIG.pointsPerVoucher;
          }
          setLoyaltyData(data);
        } else {
          setLoyaltyData({ ...DEFAULT_LOYALTY });
        }
      } catch (err) {
        console.error("Loyalty load error:", err);
        setLoyaltyData({ ...DEFAULT_LOYALTY });
      } finally {
        setLoading(false);
      }
    };

    const unsub = auth.onAuthStateChanged(load);
    return () => unsub();
  }, []);

  // ─── addPoints: called after every successful order ───────────────────────
  const addPoints = useCallback(
    async (orderId, orderAmount, orderDetails = {}, appliedVoucher = null) => {
      const user = auth.currentUser;
      if (!user) return null;

      try {
        // ── Voucher/reward was used on this order ──
        if (appliedVoucher) {
          const updatedVouchers = (loyaltyData?.unlockedVouchers || []).map(v =>
            v.voucherId === appliedVoucher
              ? { ...v, status: "used", usedAt: Timestamp.now() }
              : v
          );

          // Points reset to 0 because reward was redeemed
          const updated = {
            ...loyaltyData,
            currentPoints:    0,
            unlockedVouchers: updatedVouchers,
            pointsHistory: [
              ...(loyaltyData?.pointsHistory || []),
              {
                orderId, type: "reward_used", points: 0,
                date: Timestamp.now(),
                details: { ...orderDetails, voucherId: appliedVoucher },
              },
            ],
          };

          await updateDoc(doc(db, "users", user.uid), { loyaltyData: updated });
          setLoyaltyData(updated);
          return { earnedPoints: 0, currentPoints: 0, message: "Reward redeemed — points reset to 0" };
        }

        // ── Normal order — earn points ──
        const earned       = calculatePoints(orderAmount);
        const prevCurrent  = loyaltyData?.currentPoints ?? 0;
        const newCurrent   = prevCurrent + earned;
        const newTotal     = (loyaltyData?.totalPoints || 0) + earned;

        let finalCurrent   = newCurrent;
        const newRewards   = [];

        // Did they hit (or pass) 100?
        if (newCurrent >= VOUCHER_CONFIG.pointsPerVoucher) {
          // Unlock a reward
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + VOUCHER_CONFIG.voucherValidity);

          newRewards.push({
            voucherId:   `REWARD-${Date.now()}`,
            rewardType:  VOUCHER_CONFIG.rewardType,
            rewardName:  VOUCHER_CONFIG.rewardName,
            description: VOUCHER_CONFIG.rewardDescription,
            amount:      0,
            status:      "available",
            expiryDate:  expiry.toISOString(),
            usedAt:      null,
          });

          // Reset — carry over the remainder (e.g. earned 32 on 90pts → 122 → reset to 22)
          finalCurrent = newCurrent % VOUCHER_CONFIG.pointsPerVoucher;
        }

        const updated = {
          currentPoints:    finalCurrent,
          totalPoints:      newTotal,
          unlockedVouchers: [
            ...(loyaltyData?.unlockedVouchers || []),
            ...newRewards,
          ],
          pointsHistory: [
            ...(loyaltyData?.pointsHistory || []),
            {
              orderId, type: "earned", points: earned,
              date: Timestamp.now(), details: orderDetails,
            },
          ],
        };

        await updateDoc(doc(db, "users", user.uid), { loyaltyData: updated });
        setLoyaltyData(updated);

        return {
          earnedPoints:    earned,
          currentPoints:   finalCurrent,
          rewardsUnlocked: newRewards.length,
          message: newRewards.length > 0
            ? `🎉 You unlocked a Free Combo Meal! Points reset to ${finalCurrent}.`
            : `+${earned} points earned (${finalCurrent}/100)`,
        };

      } catch (err) {
        console.error("addPoints error:", err);
        return null;
      }
    },
    [loyaltyData]
  );

  // ─── useVoucher: mark reward as used + reset points ───────────────────────
  const useVoucher = useCallback(
    async (voucherId) => {
      const user = auth.currentUser;
      if (!user) return false;

      try {
        const updatedVouchers = loyaltyData.unlockedVouchers.map(v =>
          v.voucherId === voucherId
            ? { ...v, status: "used", usedAt: Timestamp.now() }
            : v
        );

        // Reset currentPoints to 0 on redemption
        const updated = {
          ...loyaltyData,
          currentPoints:    0,
          unlockedVouchers: updatedVouchers,
        };

        await updateDoc(doc(db, "users", user.uid), { loyaltyData: updated });
        setLoyaltyData(updated);
        return true;
      } catch (err) {
        console.error("useVoucher error:", err);
        return false;
      }
    },
    [loyaltyData]
  );

  return (
    <LoyaltyContext.Provider value={{ loyaltyData, loading, addPoints, useVoucher }}>
      {children}
    </LoyaltyContext.Provider>
  );
}
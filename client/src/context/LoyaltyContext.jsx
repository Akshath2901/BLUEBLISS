import React, { createContext, useState, useCallback, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { calculatePoints, checkVoucherUnlock, VOUCHER_CONFIG } from "../utils/loyaltyPoints";

export const LoyaltyContext = createContext();

export function LoyaltyProvider({ children }) {
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load loyalty data on mount
  useEffect(() => {
    const loadLoyaltyData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().loyaltyData) {
          setLoyaltyData(userSnap.data().loyaltyData);
        } else {
          // Initialize default loyalty data
          setLoyaltyData({
            totalPoints: 0,
            unlockedVouchers: [],
            pointsHistory: [],
          });
        }
      } catch (err) {
        console.error("Error loading loyalty data:", err);
        setLoyaltyData({
          totalPoints: 0,
          unlockedVouchers: [],
          pointsHistory: [],
        });
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(() => {
      loadLoyaltyData();
    });

    return () => unsubscribe();
  }, []);

  const addPoints = useCallback(
    async (orderId, orderAmount, orderDetails = {}, appliedVoucher = null) => {
      const user = auth.currentUser;
      if (!user) return null;

      try {
        // 🔥 IF VOUCHER IS APPLIED, DON'T ADD POINTS
        if (appliedVoucher) {
          console.log("Voucher used - Points not earned on this order");
          
          // Still mark the voucher as used
          const updatedVouchers = loyaltyData?.unlockedVouchers?.map((v) =>
            v.voucherId === appliedVoucher
              ? { ...v, status: "used", usedAt: Timestamp.now() }
              : v
          ) || [];

          const updatedLoyaltyData = {
            ...loyaltyData,
            unlockedVouchers: updatedVouchers,
            pointsHistory: [
              ...(loyaltyData?.pointsHistory || []),
              {
                orderId,
                type: "voucher_used",
                points: 0,
                date: Timestamp.now(),
                details: { ...orderDetails, voucherId: appliedVoucher },
              },
            ],
          };

          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            loyaltyData: updatedLoyaltyData,
          });

          setLoyaltyData(updatedLoyaltyData);

          return {
            earnedPoints: 0,
            totalPoints: loyaltyData?.totalPoints || 0,
            vouchersUnlocked: 0,
            voucherAmount: 0,
            message: "Voucher redeemed - No points earned on this order",
          };
        }

        // 🔥 NO VOUCHER - CALCULATE POINTS NORMALLY
        const earnedPoints = calculatePoints(orderAmount);
        const newTotalPoints = (loyaltyData?.totalPoints || 0) + earnedPoints;
        const vouchersUnlocked = checkVoucherUnlock(newTotalPoints);
        const previousVouchers = Math.floor(
          (loyaltyData?.totalPoints || 0) / 100
        );
        const newVouchersCount = vouchersUnlocked - previousVouchers;

        let newVouchers = [];
        if (newVouchersCount > 0) {
          for (let i = 0; i < newVouchersCount; i++) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + VOUCHER_CONFIG.voucherValidity);

            newVouchers.push({
              voucherId: `VOUCHER-${Date.now()}-${i}`,
              amount: VOUCHER_CONFIG.voucherAmount,
              status: "available",
              expiryDate: expiryDate.toISOString(),
              usedAt: null,
            });
          }
        }

        const updatedLoyaltyData = {
          totalPoints: newTotalPoints,
          unlockedVouchers: [
            ...(loyaltyData?.unlockedVouchers || []),
            ...newVouchers,
          ],
          pointsHistory: [
            ...(loyaltyData?.pointsHistory || []),
            {
              orderId,
              type: "earned",
              points: earnedPoints,
              date: Timestamp.now(),
              details: orderDetails,
            },
          ],
        };

        // Update Firestore
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          loyaltyData: updatedLoyaltyData,
        });

        // Update local state
        setLoyaltyData(updatedLoyaltyData);

        return {
          earnedPoints,
          totalPoints: newTotalPoints,
          vouchersUnlocked: newVouchersCount,
          voucherAmount: VOUCHER_CONFIG.voucherAmount,
        };
      } catch (err) {
        console.error("Error adding points:", err);
        return null;
      }
    },
    [loyaltyData]
  );

  const useVoucher = useCallback(
    async (voucherId) => {
      const user = auth.currentUser;
      if (!user) return false;

      try {
        const updatedVouchers = loyaltyData.unlockedVouchers.map((v) =>
          v.voucherId === voucherId
            ? { ...v, status: "used", usedAt: Timestamp.now() }
            : v
        );

        const updatedLoyaltyData = {
          ...loyaltyData,
          unlockedVouchers: updatedVouchers,
        };

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          loyaltyData: updatedLoyaltyData,
        });

        setLoyaltyData(updatedLoyaltyData);
        return true;
      } catch (err) {
        console.error("Error using voucher:", err);
        return false;
      }
    },
    [loyaltyData]
  );

  const value = {
    loyaltyData,
    loading,
    addPoints,
    useVoucher,
  };

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  );
}
// src/utils/loyaltyPoints.js

export const VOUCHER_CONFIG = {
  pointsPerVoucher:    100,
  rewardName:          "Free Combo Meal",
  rewardDescription:   "Potato Burger + Small Fries + Thums Up",
  rewardIcon:          "🍔",
  voucherValidity:     30,
  voucherAmount:       0,
  rewardType:          "combo_meal",
};

/** 1 point per ₹10 spent. e.g. ₹324 → 32 pts */
export const calculatePoints = (orderAmount) => {
  if (!orderAmount || orderAmount <= 0) return 0;
  return Math.floor(orderAmount / 10);
};

/** Points still needed to hit the 100-point reward */
export const pointsToNextReward = (currentCyclePoints) =>
  VOUCHER_CONFIG.pointsPerVoucher - currentCyclePoints;

/** 0–100 progress % */
export const rewardProgress = (currentCyclePoints) =>
  (currentCyclePoints / VOUCHER_CONFIG.pointsPerVoucher) * 100;
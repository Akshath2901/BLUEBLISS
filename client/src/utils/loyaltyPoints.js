// Helper functions for loyalty points

export const calculatePoints = (orderAmount) => {
  // Points = Order Amount ÷ 25
  return Math.floor(orderAmount / 25);
};

export const checkVoucherUnlock = (newTotalPoints) => {
  // Returns how many vouchers unlocked
  return Math.floor(newTotalPoints / 100);
};

export const getRemainingPointsForVoucher = (currentPoints) => {
  // Points needed to reach next voucher
  const pointsForNextVoucher = Math.ceil(currentPoints / 100) * 100;
  return pointsForNextVoucher - currentPoints;
};

export const VOUCHER_CONFIG = {
  pointsRequired: 100,
  voucherAmount: 400,
  voucherValidity: 30 // days
};
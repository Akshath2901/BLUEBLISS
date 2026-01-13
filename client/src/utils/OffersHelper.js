// src/utils/OffersHelper.js - Multi-functional Offer System

/**
 * 🎁 OFFER TYPES:
 * 1. FLAT: Fixed amount discount (e.g., ₹99 off)
 * 2. PERCENTAGE: Percentage discount (e.g., 20% off)
 * 3. CATEGORY: Category-specific discount (e.g., ₹99 off on Burgers)
 * 4. FREE_ITEM: Free item on minimum order (e.g., Free dessert on ₹500+)
 */

export const OFFER_TYPES = {
  FLAT: "flat",
  PERCENTAGE: "percentage",
  CATEGORY: "category",
  FREE_ITEM: "free_item",
};

/**
 * Parse offer details from title and description
 */
export const parseOfferDetails = (offer) => {
  const title = offer.title || "";
  const description = offer.description || "";
  const fullText = `${title} ${description}`.toLowerCase();

  let minAmount = 0;
  let maxDiscount = 0;
  let discountType = "flat";
  let discountValue = 0;
  let applicableCategory = null;
  let minItemCount = 1;

  // 🔍 Find minimum amount (e.g., "above 400", "on orders of 500")
  const minMatch = fullText.match(
    /(?:above|on orders?(?:\s+of)?|on(?:\s+orders?)?|₹)?\s*(\d+)(?:\s*(?:and|on|above|or more))?/
  );
  if (minMatch) {
    minAmount = parseInt(minMatch[1]);
  }

  // 🔍 Find discount value
  const amountMatch = fullText.match(
    /(?:upto|get|off|discount|save|₹)\s*₹?(\d+)/
  );
  if (amountMatch) {
    maxDiscount = parseInt(amountMatch[1]);
  }

  // 🔍 Check if percentage discount
  if (fullText.includes("%")) {
    discountType = "percentage";
    const percentMatch = fullText.match(/(\d+)%/);
    if (percentMatch) {
      discountValue = parseInt(percentMatch[1]);
    }
  } else {
    discountType = "flat";
    discountValue = maxDiscount;
  }

  // 🔍 Check for category (e.g., "on burgers", "on pizzas")
  const categoryMatch = fullText.match(
    /on\s+(burgers?|pizzas?|wraps?|desserts?|drinks?|beverages?|sides?|starters?|appetizers?)/i
  );
  if (categoryMatch) {
    applicableCategory = categoryMatch[1].toLowerCase();
  }

  // 🔍 Check for free item (e.g., "free dessert", "free drink")
  const freeItemMatch = fullText.match(/free\s+(dessert|drink|beverage|item|side|appetizer)/i);
  if (freeItemMatch) {
    discountType = "free_item";
  }

  return {
    minAmount,
    maxDiscount,
    discountType,
    discountValue,
    applicableCategory,
    minItemCount,
  };
};

/**
 * Check if cart is eligible for offer
 */
export const isOfferEligible = (cart, subtotal, offer) => {
  const offerDetails = parseOfferDetails(offer);

  // ✅ Check minimum amount
  if (subtotal < offerDetails.minAmount) {
    return {
      eligible: false,
      reason: `Minimum order ₹${offerDetails.minAmount} required`,
      amountNeeded: offerDetails.minAmount - subtotal,
    };
  }

  // ✅ Check category restriction
  if (offerDetails.applicableCategory) {
    const hasCategory = cart.some((item) => {
      const itemCategory = (item.category || "").toLowerCase();
      return itemCategory.includes(offerDetails.applicableCategory);
    });

    if (!hasCategory) {
      return {
        eligible: false,
        reason: `This offer is only for ${offerDetails.applicableCategory}`,
        itemsNeeded: `Add ${offerDetails.applicableCategory}`,
      };
    }
  }

  return {
    eligible: true,
    reason: "✓ You're eligible for this offer!",
  };
};

/**
 * Calculate actual discount for the cart
 */
export const calculateOfferDiscount = (cart, subtotal, offer) => {
  const eligibility = isOfferEligible(cart, subtotal, offer);
  const offerDetails = parseOfferDetails(offer);

  if (!eligibility.eligible) {
    return {
      discount: 0,
      eligible: false,
      reason: eligibility.reason,
      amountNeeded: eligibility.amountNeeded,
    };
  }

  let discount = 0;

  if (offerDetails.discountType === "percentage") {
    // Percentage discount
    discount = Math.floor((subtotal * offerDetails.discountValue) / 100);
    if (offerDetails.maxDiscount > 0) {
      discount = Math.min(discount, offerDetails.maxDiscount);
    }
  } else if (offerDetails.discountType === "flat") {
    // Flat discount
    discount = Math.min(offerDetails.discountValue, subtotal);
  } else if (offerDetails.discountType === "free_item") {
    // Free item (calculate as max discount or fixed amount)
    discount = offerDetails.maxDiscount || 0;
  }

  return {
    discount,
    eligible: true,
    reason: "✓ Offer applied successfully!",
    discountType: offerDetails.discountType,
    discountValue: offerDetails.discountValue,
  };
};

/**
 * Get eligible offers for current cart
 */
export const getEligibleOffers = (cart, subtotal, offers) => {
  return offers
    .filter((offer) => offer.isActive)
    .map((offer) => {
      const result = calculateOfferDiscount(cart, subtotal, offer);
      return {
        ...offer,
        ...result,
        savings: result.discount,
      };
    })
    .sort((a, b) => b.savings - a.savings); // Sort by best savings
};

/**
 * Get ineligible offers with reason
 */
export const getIneligibleOffers = (cart, subtotal, offers) => {
  return offers
    .filter((offer) => offer.isActive)
    .filter((offer) => !isOfferEligible(cart, subtotal, offer).eligible)
    .map((offer) => {
      const eligibility = isOfferEligible(cart, subtotal, offer);
      const offerDetails = parseOfferDetails(offer);
      return {
        ...offer,
        eligible: false,
        reason: eligibility.reason,
        amountNeeded: eligibility.amountNeeded,
        minAmount: offerDetails.minAmount,
      };
    });
};

/**
 * Format offer display text
 */
export const formatOfferText = (offer) => {
  const offerDetails = parseOfferDetails(offer);

  let displayText = offer.title || "";

  if (offerDetails.discountType === "percentage") {
    displayText += ` - ${offerDetails.discountValue}% off`;
  } else if (offerDetails.discountType === "flat") {
    displayText += ` - ₹${offerDetails.discountValue} off`;
  }

  if (offerDetails.minAmount > 0) {
    displayText += ` on ₹${offerDetails.minAmount}+`;
  }

  return displayText;
};

/**
 * Check if offer code exists and is valid
 */
export const validateOfferCode = (offers, code) => {
  const offer = offers.find(
    (o) => o.code.toUpperCase() === code.toUpperCase() && o.isActive
  );
  return offer || null;
};
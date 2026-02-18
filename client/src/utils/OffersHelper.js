// src/utils/OffersHelper.js
// ✅ FIXED: Uses structured Firestore fields directly (discountValue, offerType, etc.)
// instead of trying to parse discount values from title/description text.

export const OFFER_TYPES = {
  FLAT:       "flat",
  PERCENTAGE: "percentage",
  CATEGORY:   "category",
  FREE_ITEM:  "free_item",
};

/**
 * Check if cart is eligible for an offer.
 * Uses the structured fields saved by Super Admin.
 */
export const isOfferEligible = (cart, subtotal, offer) => {
  const minOrder    = Number(offer.minOrderAmount) || 0;
  const offerType   = offer.offerType || "flat";
  const category    = (offer.applicableCategory || "").toLowerCase().trim();

  // ✅ Check minimum order amount
  if (subtotal < minOrder) {
    return {
      eligible:     false,
      reason:       `Minimum order ₹${minOrder} required`,
      amountNeeded: minOrder - subtotal,
    };
  }

  // ✅ Check category restriction (only for category-type offers)
  if (offerType === "category" && category) {
    // Normalize: lowercase + strip trailing 's' to match "pizza"↔"pizzas", "burger"↔"burgers" etc.
    const normalize = (str) => str.toLowerCase().trim().replace(/s$/, "");
    const normalizedOfferCat = normalize(category);

    const hasCategory = cart.some((item) => {
      const normalizedItemCat = normalize(item.category || "");
      return (
        normalizedItemCat === normalizedOfferCat ||          // exact match after normalize
        normalizedItemCat.includes(normalizedOfferCat) ||   // item cat contains offer cat
        normalizedOfferCat.includes(normalizedItemCat)      // offer cat contains item cat
      );
    });

    if (!hasCategory) {
      return {
        eligible:    false,
        reason:      `This offer is only for ${category}`,
        itemsNeeded: `Add ${category}`,
      };
    }
  }

  return {
    eligible: true,
    reason:   "✓ You're eligible for this offer!",
  };
};

/**
 * Calculate the actual discount amount for the cart.
 * Uses structured fields: offerType, discountValue, minOrderAmount, maxDiscount.
 */
export const calculateOfferDiscount = (cart, subtotal, offer) => {
  const eligibility = isOfferEligible(cart, subtotal, offer);

  if (!eligibility.eligible) {
    return {
      discount:     0,
      eligible:     false,
      reason:       eligibility.reason,
      amountNeeded: eligibility.amountNeeded,
    };
  }

  const offerType     = offer.offerType   || "flat";
  const discountValue = Number(offer.discountValue) || 0;
  const maxDiscount   = Number(offer.maxDiscount)   || 0;

  let discount = 0;

  if (offerType === "flat") {
    // e.g. ₹99 off — capped at subtotal so discount never exceeds order value
    discount = Math.min(discountValue, subtotal);

  } else if (offerType === "percentage") {
    // e.g. 20% off
    discount = Math.floor((subtotal * discountValue) / 100);
    // Apply max discount cap if set
    if (maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }

  } else if (offerType === "category") {
    // Same normalize helper as isOfferEligible — strips trailing 's', lowercases
    const normalize = (str) => str.toLowerCase().trim().replace(/s$/, "");
    const normalizedOfferCat = normalize(offer.applicableCategory || "");

    const categorySubtotal = cart
      .filter((item) => {
        const normalizedItemCat = normalize(item.category || "");
        return (
          normalizedItemCat === normalizedOfferCat ||
          normalizedItemCat.includes(normalizedOfferCat) ||
          normalizedOfferCat.includes(normalizedItemCat)
        );
      })
      .reduce((sum, item) => sum + item.price * item.qty, 0);

    // Flat discount on matching category items, capped by maxDiscount if set
    discount = Math.min(discountValue, categorySubtotal);
    if (maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }

  } else if (offerType === "free_item") {
    // Treat as a flat discount equal to discountValue
    // (the actual free item logic is handled at order level)
    discount = Math.min(discountValue, subtotal);
  }

  return {
    discount,
    eligible:      true,
    reason:        "✓ Offer applied successfully!",
    discountType:  offerType,
    discountValue,
  };
};

/**
 * Returns all active offers that the current cart is eligible for,
 * sorted best savings first.
 */
export const getEligibleOffers = (cart, subtotal, offers) => {
  return offers
    .filter((offer) => offer.isActive)
    .filter((offer) => isOfferEligible(cart, subtotal, offer).eligible)
    .map((offer) => {
      const result = calculateOfferDiscount(cart, subtotal, offer);
      return { ...offer, ...result, savings: result.discount };
    })
    .sort((a, b) => b.savings - a.savings);
};

/**
 * Returns active offers the cart is NOT yet eligible for (with reason shown).
 */
export const getIneligibleOffers = (cart, subtotal, offers) => {
  return offers
    .filter((offer) => offer.isActive)
    .filter((offer) => !isOfferEligible(cart, subtotal, offer).eligible)
    .map((offer) => {
      const eligibility = isOfferEligible(cart, subtotal, offer);
      return {
        ...offer,
        eligible:     false,
        reason:       eligibility.reason,
        amountNeeded: eligibility.amountNeeded,
        minAmount:    Number(offer.minOrderAmount) || 0,
      };
    });
};

/**
 * Validate an offer code entered manually by the user.
 */
export const validateOfferCode = (offers, code) => {
  return (
    offers.find(
      (o) => o.isActive && o.code?.toUpperCase() === code?.toUpperCase()
    ) || null
  );
};

/**
 * Format a short display string for an offer badge/chip.
 */
export const formatOfferText = (offer) => {
  const offerType     = offer.offerType   || "flat";
  const discountValue = Number(offer.discountValue) || 0;
  const minOrder      = Number(offer.minOrderAmount) || 0;

  let text = "";
  if (offerType === "percentage")   text = `${discountValue}% off`;
  else if (offerType === "flat")    text = `₹${discountValue} off`;
  else if (offerType === "category")text = `₹${discountValue} off on ${offer.applicableCategory || "selected items"}`;
  else if (offerType === "free_item")text = "Free item";

  if (minOrder > 0) text += ` on ₹${minOrder}+`;
  return text;
};
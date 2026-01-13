import React, { useState, useEffect } from "react";
import { checkStockAvailability } from "../lib/services/StockService";

/**
 * 🔍 Stock Validation Component
 * Shows warnings if cart items cannot be fulfilled due to low stock
 * Place this in your CartPage before the checkout button
 */
export default function CartStockValidator({ cart, onValidationChange }) {
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cart || cart.length === 0) {
      setValidationResult(null);
      if (onValidationChange) onValidationChange(true);
      return;
    }

    const checkStock = async () => {
      setLoading(true);
      try {
        const result = await checkStockAvailability(cart);
        
        // Transform the result to match expected format
        const transformedResult = {
          canFulfill: result.canFulfill,
          missingIngredients: result.unavailableItems?.map(item => ({
            name: item.name,
            needed: item.required || 0,
            available: item.available || 0,
            shortage: (item.required || 0) - (item.available || 0),
            reason: item.reason
          })) || [],
          errors: result.error ? [result.error] : []
        };
        
        setValidationResult(transformedResult);
        if (onValidationChange) {
          onValidationChange(transformedResult.canFulfill);
        }
      } catch (error) {
        console.error("Stock validation error:", error);
        setValidationResult({
          canFulfill: false,
          missingIngredients: [],
          errors: [error.message],
        });
        if (onValidationChange) onValidationChange(false);
      } finally {
        setLoading(false);
      }
    };

    checkStock();
  }, [cart, onValidationChange]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>
          <span style={{ fontSize: "24px" }}>⏳</span>
          <p style={{ margin: "8px 0 0 0" }}>Checking ingredient availability...</p>
        </div>
      </div>
    );
  }

  if (!validationResult) return null;

  // Show success message
  if (validationResult.canFulfill && !validationResult.errors?.length) {
    return (
      <div style={styles.container}>
        <div style={styles.successBox}>
          <span style={{ fontSize: "24px" }}>✅</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: "700" }}>All items in stock!</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
              Your order can be fulfilled
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show errors
  if (validationResult.errors?.length > 0) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <span style={{ fontSize: "24px" }}>❌</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 8px 0", fontWeight: "700" }}>Stock Check Error</p>
            {validationResult.errors.map((err, idx) => (
              <p key={idx} style={{ margin: "4px 0", fontSize: "13px" }}>• {err}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show missing ingredients
  if (validationResult.missingIngredients?.length > 0) {
    return (
      <div style={styles.container}>
        <div style={styles.warningBox}>
          <span style={{ fontSize: "32px" }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 12px 0", fontWeight: "700", fontSize: "16px" }}>
              Insufficient Stock
            </p>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", opacity: 0.9 }}>
              The following ingredients are running low:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {validationResult.missingIngredients.map((ing, idx) => (
                <div key={idx} style={styles.ingredientItem}>
                  <div>
                    <p style={{ margin: 0, fontWeight: "700", fontSize: "14px" }}>{ing.name}</p>
                    {ing.reason ? (
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
                        {ing.reason}
                      </p>
                    ) : (
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
                        Need: {ing.needed} • Available: {ing.available} • Short: {ing.shortage}
                      </p>
                    )}
                  </div>
                  {!ing.reason && (
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${Math.min((ing.available / ing.needed) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p style={{ margin: "16px 0 0 0", fontSize: "13px", opacity: 0.85 }}>
              💡 Please remove some items or wait for stock replenishment
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    marginTop: "20px",
    marginBottom: "20px",
  },
  loadingBox: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "2px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    color: "#fff",
  },
  successBox: {
    background: "linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(69, 160, 73, 0.15))",
    border: "2px solid #4caf50",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    color: "#fff",
  },
  errorBox: {
    background: "linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(229, 57, 53, 0.15))",
    border: "2px solid #f44336",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    color: "#fff",
  },
  warningBox: {
    background: "linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(251, 140, 0, 0.15))",
    border: "2px solid #ff9800",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    color: "#fff",
  },
  ingredientItem: {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "12px",
  },
  progressBar: {
    height: "6px",
    background: "rgba(0, 0, 0, 0.3)",
    borderRadius: "3px",
    marginTop: "8px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ff9800, #ff5722)",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
};
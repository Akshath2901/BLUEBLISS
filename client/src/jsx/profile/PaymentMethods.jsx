// /src/jsx/profile/PaymentMethods.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import "./profile.css";

export default function PaymentMethods() {
  const [payments, setPayments] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState("card");
  const [formData, setFormData] = useState({
    type: "card",
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    upiId: "",
    phoneNumber: "",
    bankName: "",
    accountNumber: "",
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadPayments(currentUser.uid);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const loadPayments = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data().payments) {
        setPayments(snap.data().payments);
      }
    } catch (err) {
      console.error("Error loading payments:", err);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      let newPayment = {
        id: Date.now(),
        type: formData.type,
        addedDate: new Date().toLocaleDateString(),
      };

      if (formData.type === "card") {
        newPayment = {
          ...newPayment,
          cardName: formData.cardName,
          cardNumber: `XXXX-XXXX-XXXX-${formData.cardNumber.slice(-4)}`,
          expiryDate: formData.expiryDate,
          last4: formData.cardNumber.slice(-4),
        };
      } else if (formData.type === "upi") {
        newPayment = {
          ...newPayment,
          upiId: formData.upiId,
        };
      } else if (formData.type === "bank") {
        newPayment = {
          ...newPayment,
          bankName: formData.bankName,
          accountNumber: `XXXX-XXXX-${formData.accountNumber.slice(-4)}`,
          last4: formData.accountNumber.slice(-4),
        };
      }

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        payments: arrayUnion(newPayment),
      });

      setPayments([...payments, newPayment]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("Error adding payment:", err);
      alert("Error adding payment method");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!user) return;

    try {
      const paymentToDelete = payments.find((p) => p.id === paymentId);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        payments: arrayRemove(paymentToDelete),
      });

      setPayments(payments.filter((p) => p.id !== paymentId));
    } catch (err) {
      console.error("Error deleting payment:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "card",
      cardName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      upiId: "",
      phoneNumber: "",
      bankName: "",
      accountNumber: "",
    });
    setPaymentType("card");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    setFormData((prev) => ({
      ...prev,
      type: type,
    }));
  };

  return (
    <div className="payments-container">
      <div className="content-header">
        <h2>💳 Payment Methods</h2>
        <button
          className="add-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Close" : "+ Add Payment"}
        </button>
      </div>

      {showForm && (
        <div className="payment-form-wrapper">
          <div className="payment-type-selector">
            <button
              className={`type-btn ${paymentType === "card" ? "active" : ""}`}
              onClick={() => handlePaymentTypeChange("card")}
            >
              💳 Credit/Debit Card
            </button>
            <button
              className={`type-btn ${paymentType === "upi" ? "active" : ""}`}
              onClick={() => handlePaymentTypeChange("upi")}
            >
              📱 UPI
            </button>
            <button
              className={`type-btn ${paymentType === "bank" ? "active" : ""}`}
              onClick={() => handlePaymentTypeChange("bank")}
            >
              🏦 Bank Account
            </button>
          </div>

          <form className="payment-form" onSubmit={handleAddPayment}>
            {formData.type === "card" && (
              <>
                <input
                  type="text"
                  name="cardName"
                  placeholder="Cardholder Name"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="Card Number"
                  maxLength="16"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  required
                />
                <div className="form-row">
                  <input
                    type="text"
                    name="expiryDate"
                    placeholder="MM/YY"
                    maxLength="5"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="cvv"
                    placeholder="CVV"
                    maxLength="3"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            {formData.type === "upi" && (
              <>
                <input
                  type="text"
                  name="upiId"
                  placeholder="UPI ID (e.g., name@bank)"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  required
                />
              </>
            )}

            {formData.type === "bank" && (
              <>
                <input
                  type="text"
                  name="bankName"
                  placeholder="Bank Name"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Account Number"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  required
                />
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Adding..." : "Add Payment Method"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="empty-state-card">
          <p className="empty-icon">💳</p>
          <p>No payment methods added yet</p>
          <small>Add a credit card, UPI, or bank account to get started</small>
        </div>
      ) : (
        <div className="payments-grid">
          {payments.map((payment) => (
            <div key={payment.id} className="payment-card">
              <div className="payment-header">
                {payment.type === "card" && <span className="payment-icon">💳</span>}
                {payment.type === "upi" && <span className="payment-icon">📱</span>}
                {payment.type === "bank" && <span className="payment-icon">🏦</span>}
                <div className="payment-details">
                  {payment.type === "card" && (
                    <>
                      <h4>{payment.cardName}</h4>
                      <p className="card-number">{payment.cardNumber}</p>
                      <small>Valid till {payment.expiryDate}</small>
                    </>
                  )}
                  {payment.type === "upi" && (
                    <>
                      <h4>UPI</h4>
                      <p className="upi-id">{payment.upiId}</p>
                    </>
                  )}
                  {payment.type === "bank" && (
                    <>
                      <h4>{payment.bankName}</h4>
                      <p className="account-number">{payment.accountNumber}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="payment-footer">
                <small className="added-date">Added {payment.addedDate}</small>
                <button
                  className="delete-btn"
                  onClick={() => handleDeletePayment(payment.id)}
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useContext } from "react";
import "./Billing.css";
import { CartContext } from "../context/CartContext";

function Billing() {
  const { cart } = useContext(CartContext);

  const subTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const gst = (subTotal * 0.05).toFixed(2);
  const delivery = 40;
  const total = (subTotal + Number(gst) + delivery).toFixed(2);

  const proceedToPay = () => {
    window.location.href = "/payment-gateway";
  };

  return (
    <div className="billing-container">
      <h2>Billing Summary</h2>

      <div className="billing-card">
        {cart.map((item) => (
          <div className="bill-item" key={item.id}>
            <span>{item.name} × {item.qty}</span>
            <span>₹{item.price * item.qty}</span>
          </div>
        ))}

        <hr />

        <div className="bill-row">
          <span>Subtotal</span>
          <span>₹{subTotal}</span>
        </div>

        <div className="bill-row">
          <span>GST (5%)</span>
          <span>₹{gst}</span>
        </div>

        <div className="bill-row">
          <span>Delivery Charges</span>
          <span>₹{delivery}</span>
        </div>

        <hr />

        <div className="bill-total">
          <strong>Total</strong>
          <strong>₹{total}</strong>
        </div>

        <button className="pay-btn" onClick={proceedToPay}>
          Proceed to Pay
        </button>
      </div>
    </div>
  );
}

export default Billing;

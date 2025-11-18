import React, { useEffect } from "react";

function PaymentGateway() {
  useEffect(() => {
    alert("Redirecting to Razorpay / PhonePe Checkout...");
    // You will integrate the gateway script here
  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Redirecting to Payment Gateway...</h2>
    </div>
  );
}

export default PaymentGateway;

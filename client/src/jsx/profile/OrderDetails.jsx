import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./profile.css";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    async function loadOrder() {
      const user = auth.currentUser;
      if (!user) return;

      const orderRef = doc(db, "orders", id);
      const snap = await getDoc(orderRef);
      setOrder(snap.data());
    }

    loadOrder();
  }, [id]);

  if (!order) {
    return <p className="loading">Loading order details...</p>;
  }

  return (
    <div className="order-details-container">
      <div className="order-details-card">

        {/* Header Row */}
        <div className="details-header">
          <div>
            <h2 className="details-title">Order #{order.orderId}</h2>
            <p className="details-subtext">
              Placed on:{" "}
              {order.createdAt?.toDate
                ? order.createdAt.toDate().toLocaleString()
                : ""}
            </p>
          </div>

          <span className={`status-badge-lg ${order.status.toLowerCase()}`}>
            {order.status}
          </span>
        </div>

        {/* Divider */}
        <hr className="divider" />

        {/* Items Section */}
        <h3 className="section-heading">Items Ordered</h3>

        <ul className="details-items-list">
          {order.items?.map((item, index) => (
            <li className="details-item" key={index}>
              <span className="item-name">{item.name}</span>
              <span className="item-qty">× {item.qty}</span>
              <span className="item-price">₹{item.price * item.qty}</span>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <hr className="divider" />

        {/* Billing */}
        <h3 className="section-heading">Bill Summary</h3>

        <div className="bill-box">
          <div className="bill-row">
            <span>Subtotal</span>
            <span>₹{order.subtotal || "---"}</span>
          </div>
          <div className="bill-row">
            <span>Delivery Fee</span>
            <span>₹{order.deliveryFee || 42}</span>
          </div>
          <div className="bill-row">
            <span>GST & Charges</span>
            <span>₹{order.gst || "---"}</span>
          </div>

          <div className="bill-divider"></div>

          <div className="bill-row total">
            <strong>Total Paid</strong>
            <strong className="total-price">₹{order.total}</strong>
          </div>
        </div>

        {/* Divider */}
        <hr className="divider" />

        {/* Address */}
        <h3 className="section-heading">Delivery Address</h3>

        <div className="address-box">
          <p>{order.address.houseNo && `${order.address.houseNo}, `}{order.address.street}</p>
          <p>{order.address.area}, {order.address.city}</p>
          <p>{order.address.state} - {order.address.pincode}</p>
          {order.address.landmark && (
            <p className="landmark">📍 {order.address.landmark}</p>
          )}
        </div>

      </div>
    </div>
  );
}


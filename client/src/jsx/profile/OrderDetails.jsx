// src/jsx/profile/OrderDetails.jsx — BlueBliss V2.0
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./profile.css";

export default function OrderDetails() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "orders", id));
        if (snap.exists()) setOrder(snap.data());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadOrder();
  }, [id]);

  if (loading) return <p className="loading">Loading order details…</p>;
  if (!order)  return <p className="loading">Order not found.</p>;

  const statusClass = order.status?.toLowerCase() || "pending";

  return (
    <div className="order-details-container">
      <button className="pf-btn-ghost" style={{ marginBottom:24, display:"inline-flex", alignItems:"center", gap:8 }}
        onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="order-details-card">

        {/* Header */}
        <div className="details-header">
          <div>
            <h2 className="details-title">Order #{order.orderId}</h2>
            <p className="details-subtext">
              Placed on:{" "}
              {order.createdAt?.toDate
                ? order.createdAt.toDate().toLocaleString()
                : "—"}
            </p>
          </div>
          <span className={`status-badge-lg ${statusClass}`}>{order.status}</span>
        </div>

        <hr className="divider" />

        {/* Items */}
        <h3 className="section-heading">Items Ordered</h3>
        <ul className="details-items-list">
          {(order.cart || order.items || []).map((item, i) => (
            <li key={i} className="details-item">
              <span className="item-name">{item.name}</span>
              <span className="item-qty">× {item.qty}</span>
              <span className="item-price">₹{item.price * item.qty}</span>
            </li>
          ))}
        </ul>

        <hr className="divider" />

        {/* Bill */}
        <h3 className="section-heading">Bill Summary</h3>
        <div className="bill-box">
          <div className="bill-row"><span>Item Total</span><span>₹{order.subtotal || "—"}</span></div>
          <div className="bill-row"><span>Delivery Fee</span><span>₹{order.deliveryFee || 42}</span></div>
          <div className="bill-row"><span>GST & Charges</span><span>₹{order.gst || "—"}</span></div>
          {(order.totalDiscount > 0) && (
            <div className="bill-row" style={{ color:"var(--pf-green)" }}>
              <span>Discounts</span><span>−₹{order.totalDiscount}</span>
            </div>
          )}
          <div className="bill-divider" />
          <div className="bill-row total">
            <strong>Total Paid</strong>
            <strong className="total-price">₹{order.total}</strong>
          </div>
        </div>

        <hr className="divider" />

        {/* Address */}
        <h3 className="section-heading">Delivery Address</h3>
        <div className="address-box">
          {order.address?.fullAddress ? (
            <p>{order.address.fullAddress}</p>
          ) : (
            <>
              <p>{order.address?.houseNo && `${order.address.houseNo}, `}{order.address?.street}</p>
              <p>{order.address?.area}{order.address?.city ? `, ${order.address.city}` : ""}</p>
              <p>{order.address?.state} {order.address?.pincode ? `— ${order.address.pincode}` : ""}</p>
            </>
          )}
          {order.address?.landmark && <p className="landmark">📌 {order.address.landmark}</p>}
          {order.address?.deliveryInfo?.deliveryTime && (
            <p style={{ color:"var(--pf-green)", fontWeight:700, fontSize:13, marginTop:8 }}>
              ⏱️ {order.address.deliveryInfo.deliveryTime}
            </p>
          )}
        </div>

        {/* Special notes */}
        {order.noContact && (
          <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(226,55,68,0.08)", border:"1px solid rgba(226,55,68,0.2)", borderRadius:12, color:"var(--pf-red)", fontWeight:700, fontSize:13 }}>
            🔒 No-Contact Delivery Requested
          </div>
        )}
        {order.suggestion && (
          <div style={{ marginTop:10, padding:"12px 16px", background:"var(--pf-surface2)", border:"1px solid var(--pf-border)", borderRadius:12, fontSize:13, color:"var(--pf-text-dim)" }}>
            📝 {order.suggestion}
          </div>
        )}
      </div>
    </div>
  );
}
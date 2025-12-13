import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminOrderDetails(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    async function load(){
      const ref = doc(db, "orders", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
      setLoading(false);
    }
    load();
  },[id]);

  if (loading) return <p>Loading...</p>;
  if (!order) return <p>Order not found</p>;

  const updateStatus = async (newStatus) => {
    const ref = doc(db, "orders", id);
    await updateDoc(ref, { orderStatus: newStatus });
    // Optionally write to sales collection on delivered
    if (newStatus === "delivered"){
      // implement sales aggregation if desired
    }
    navigate("/admin/orders");
  };

  return (
    <div className="order-details">
      <div className="details-header">
        <h3>Order #{order.id.slice(-6)}</h3>
        <div className={`status ${order.orderStatus}`}>{order.orderStatus}</div>
      </div>

      <div className="details-grid">
        <div>
          <h4>Customer</h4>
          <p>{order.name}</p>
          <p>{order.phone}</p>
          <p>{order.address}</p>
        </div>

        <div>
          <h4>Items</h4>
          {order.items?.map((it, idx) => (
            <div key={idx}>{it.qty} x {it.name} - ₹{it.price}</div>
          ))}
        </div>

        <div>
          <h4>Instructions</h4>
          <div className="instructions">{order.instructions || "None"}</div>
        </div>

        <div>
          <h4>Total</h4>
          <div className="total-amount">₹{order.totalAmount}</div>
        </div>
      </div>

      <div className="details-actions">
        {order.orderStatus === "placed" && <>
          <button onClick={() => updateStatus("accepted")}>Accept</button>
          <button onClick={() => updateStatus("cancelled")}>Reject</button>
        </>}
        {order.orderStatus === "accepted" && <button onClick={() => updateStatus("preparing")}>Start Preparing</button>}
        {order.orderStatus === "preparing" && <button onClick={() => updateStatus("ready")}>Mark Ready</button>}
        {order.orderStatus === "ready" && <button onClick={() => updateStatus("picked")}>Out for Delivery</button>}
        {order.orderStatus === "picked" && <button onClick={() => updateStatus("delivered")}>Complete</button>}
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";

export default function UserProfile() {
  const user = auth.currentUser;

  return (
    <div className="profile-container">

      <div className="profile-header">
        <img
          src={user?.photoURL || "/default-profile.png"}
          alt="profile"
          className="profile-pic"
        />
        <h3>{user?.displayName || "User"}</h3>
        <p>{user?.email}</p>
      </div>

      <div className="profile-links">
        <Link to="/my-orders" className="profile-link">📦 My Orders</Link>
        <Link to="/my-ratings" className="profile-link">⭐ My Ratings</Link>
        <Link to="/help" className="profile-link">❓ Help & Support</Link>

        <button
          className="logout-btn"
          onClick={() => auth.signOut()}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import AddressAutocompleteInput from "../AddressAutocompleteInput";
import "./profile.css";

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: "Home",
    houseNo: "",
    street: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    phoneNumber: "",
    fullAddress: "",
    coordinates: null,
    deliveryInfo: null,
  });

  const addressLabels = ["Home", "Work", "College", "Friends & Family", "Other"];

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadAddresses(currentUser.uid);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const loadAddresses = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data().addresses) {
        setAddresses(snap.data().addresses);
      }
    } catch (err) {
      console.error("Error loading addresses:", err);
    }
  };

  const handleAutocompleteSelect = (addressData) => {
    if (!addressData.deliveryInfo?.isDeliverable) {
      alert('❌ Sorry, we do not deliver to this location. Please try a different address.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      houseNo: addressData.components.houseNo,
      street: addressData.components.street,
      area: addressData.components.area,
      city: addressData.components.city,
      state: addressData.components.state,
      pincode: addressData.components.pincode,
      fullAddress: addressData.fullAddress,
      coordinates: addressData.coordinates,
      deliveryInfo: addressData.deliveryInfo,
    }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.street || !formData.area || !formData.city) {
      alert("Please fill in Street, Area, and City");
      return;
    }

    if (formData.deliveryInfo && !formData.deliveryInfo.isDeliverable) {
      alert('❌ We cannot deliver to this address. Please select an address within our delivery range.');
      return;
    }

    try {
      setLoading(true);

      const newAddress = {
        id: editingId || Date.now(),
        ...formData,
        createdAt: new Date().toLocaleDateString(),
      };

      if (editingId) {
        const updatedAddresses = addresses.map((addr) =>
          addr.id === editingId ? newAddress : addr
        );
        await updateDoc(doc(db, "users", user.uid), {
          addresses: updatedAddresses,
        });
        setAddresses(updatedAddresses);
      } else {
        await updateDoc(doc(db, "users", user.uid), {
          addresses: arrayUnion(newAddress),
        });
        setAddresses([...addresses, newAddress]);
      }

      resetForm();
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error saving address:", err);
      alert("Error saving address");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setFormData(address);
    setEditingId(address.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteAddress = async (addressId) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      const addressToDelete = addresses.find((a) => a.id === addressId);
      await updateDoc(doc(db, "users", user.uid), {
        addresses: arrayRemove(addressToDelete),
      });
      setAddresses(addresses.filter((a) => a.id !== addressId));
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      label: "Home",
      houseNo: "",
      street: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      phoneNumber: "",
      fullAddress: "",
      coordinates: null,
      deliveryInfo: null,
    });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="addresses-container">
      <div className="content-header">
        <h2>📍 Saved Addresses</h2>
        <button
          className="add-btn"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "✕ Close" : "+ Add Address"}
        </button>
      </div>

      {showForm && (
        <form className="address-form" onSubmit={handleAddAddress}>
          <div className="form-section">
            <label>Address Type</label>
            <div className="label-buttons">
              {addressLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`label-btn ${formData.label === label ? "active" : ""}`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, label: label }))
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ GOOGLE ADDRESS AUTOCOMPLETE */}
          <div className="form-section" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              🔍 Search Address
            </label>
            <AddressAutocompleteInput
              onAddressSelect={handleAutocompleteSelect}
              placeholder="Start typing your address..."
              showDeliveryInfo={true}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
              💡 Select from suggestions to auto-fill the form below
            </p>
          </div>

          <div className="form-row">
            <input
              type="text"
              name="houseNo"
              placeholder="House/Flat No."
              value={formData.houseNo}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="street"
              placeholder="Street"
              value={formData.street}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              name="area"
              placeholder="Area"
              value={formData.area}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="pincode"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={handleInputChange}
            />
          </div>

          <input
            type="text"
            name="landmark"
            placeholder="Landmark (Optional)"
            value={formData.landmark}
            onChange={handleInputChange}
          />

          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
          />

          {formData.deliveryInfo?.deliveryTime && (
            <div style={{ 
              padding: '12px', 
              background: '#e8f5e9', 
              borderRadius: '8px', 
              marginBottom: '15px',
              border: '2px solid #4caf50'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#4caf50', fontWeight: '700' }}>
                ✅ Delivery to this address: {formData.deliveryInfo.deliveryTime}
              </p>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update Address" : "Save Address"}
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
      )}

      {addresses.length === 0 ? (
        <div className="empty-state-card">
          <p className="empty-icon">📍</p>
          <p>No addresses saved yet</p>
          <small>Add your first delivery address to get started</small>
        </div>
      ) : (
        <div className="addresses-grid">
          {addresses.map((address) => (
            <div key={address.id} className="address-card">
              <div className="address-label-badge">{address.label}</div>
              
              <div className="address-content">
                <h4>
                  {address.houseNo && `${address.houseNo}, `}
                  {address.street}
                </h4>
                <p>
                  {address.area}
                  {address.city ? `, ${address.city}` : ""}
                </p>
                {address.state && address.pincode && (
                  <p>
                    {address.state} - {address.pincode}
                  </p>
                )}
                {address.landmark && (
                  <p className="landmark">
                    <span className="landmark-icon">📌</span>
                    {address.landmark}
                  </p>
                )}
                {address.phoneNumber && (
                  <p className="phone-info">
                    <span className="phone-icon">📞</span>
                    {address.phoneNumber}
                  </p>
                )}
                {address.deliveryInfo?.deliveryTime && (
                  <p style={{ marginTop: '8px', color: '#4caf50', fontSize: '13px', fontWeight: '600' }}>
                    ⏱️ Delivery in {address.deliveryInfo.deliveryTime}
                  </p>
                )}
              </div>

              <div className="address-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEditAddress(address)}
                >
                  EDIT
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteAddress(address.id)}
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
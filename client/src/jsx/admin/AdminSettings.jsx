import React from "react";
import { getAuth, updatePassword } from "firebase/auth";

export default function AdminSettings(){
  const auth = getAuth();
  const user = auth.currentUser;

  const changePassword = async (e) => {
    e.preventDefault();
    const pw = e.target.pw.value;
    try {
      await updatePassword(user, pw);
      alert("Password changed");
    } catch (err) {
      console.error(err);
      alert("Failed to change password. Re-login required.");
    }
  };

  return (
    <div className="admin-settings-page">
      <h3>Settings</h3>
      <div>Logged in as: {user?.email}</div>

      <form onSubmit={changePassword}>
        <label>New password</label>
        <input name="pw" type="password" required />
        <button type="submit">Change password</button>
      </form>
    </div>
  );
}

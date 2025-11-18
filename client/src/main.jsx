import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "./context/AuthContext";

import { CartProvider } from "./context/CartContext";  // 🟢 ADD THIS

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
    <CartProvider>    {/* 🟢 WRAP APP HERE */}
      <App />
    </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);

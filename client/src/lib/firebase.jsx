// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBE013NRiCGJqPa-SEPbu-GDMFVNZf24Lc",
  authDomain: "bluebliss-813db.firebaseapp.com",
  projectId: "bluebliss-813db",
  storageBucket: "bluebliss-813db.firebasestorage.app",
  messagingSenderId: "125399707723",
  appId: "1:125399707723:web:73e4414c4ef8a5ac87ddce",
  measurementId: "G-EPG9VGF22D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
const analytics = getAnalytics(app);
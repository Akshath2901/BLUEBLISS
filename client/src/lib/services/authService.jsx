import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth';
import { auth, db } from './firebase'; // ✅ update path based on your project
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const authService = {
  // ✅ Sign up with email
  async signupWithEmail(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email,
      name,
      createdAt: new Date(),
      phone: null,
      defaultAddress: null,
    });
    
    return userCredential;
  },

  // ✅ Sign in with email
  async signinWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },

  // ✅ Get current user profile
  async getUserProfile(uid) {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? docSnap.data() : null;
  },
};

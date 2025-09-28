import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD3IgwLbp76NbriK3OuZCTNEBM3UA2DgvM",
  authDomain: "zai-investing.firebaseapp.com",
  projectId: "zai-investing",
  storageBucket: "zai-investing.firebasestorage.app",
  messagingSenderId: "538522431141",
  appId: "1:538522431141:web:d7c87ad2b4c49d8b31e74c",
  measurementId: "G-Z4GZ4GERS8"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
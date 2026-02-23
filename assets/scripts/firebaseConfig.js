import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMZJvuguKqaiPmiWc1Bjklg8WCdI4I0Oo",
  authDomain: "qs-erp-system-12bdf.firebaseapp.com",
  projectId: "qs-erp-system-12bdf",
  storageBucket: "qs-erp-system-12bdf.firebasestorage.app",
  messagingSenderId: "775395591227",
  appId: "1:775395591227:web:13af53786aa7ea14ad881e",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

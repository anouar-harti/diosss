import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- IMPORTANTE: PEGA AQUÍ TUS DATOS DE FIREBASE CONSOLE ---
const firebaseConfig = {
apiKey: "AIzaSyDu2bL9mxXWf3rKHse-gLG508cO5mRlkX8",
  authDomain: "climatrack-pro.firebaseapp.com",
  projectId: "climatrack-pro",
  storageBucket: "climatrack-pro.firebasestorage.app",
  messagingSenderId: "829822907753",
  appId: "1:829822907753:web:9b053dc278c4a039cdf9f8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
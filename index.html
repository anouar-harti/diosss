import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

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
export const storage = getStorage(app);
export const auth = getAuth(app);

// Attempt anonymous auth, but do not throw or crash if not enabled.
// If this fails, the user needs to set Storage rules to `allow read, write: if true;`
signInAnonymously(auth).catch((error) => {
  console.warn("No se pudo iniciar sesión anónima (probablemente esté desactivado en Firebase Console). Asegúrate de que las reglas de Firebase Storage estén en 'allow read, write: if true;'. Detalle:", error.message);
});
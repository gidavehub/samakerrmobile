import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCcgBbIa3kmES7b0pU777nyuQRwkGt2gT8",
  authDomain: "red-girder-461916-a1.firebaseapp.com",
  databaseURL: "https://red-girder-461916-a1-default-rtdb.firebaseio.com",
  projectId: "red-girder-461916-a1",
  storageBucket: "red-girder-461916-a1.firebasestorage.app",
  messagingSenderId: "726942488292",
  appId: "1:726942488292:web:0fb5f7008c51bede867ef1",
  measurementId: "G-DBZQF7G4G8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const database = getDatabase(app);
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics, auth, database };

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC348ZDMPKGMdFgILt9aHhkCvdu8buk5aI",
  authDomain: "my-social-app-188ed.firebaseapp.com",
  projectId: "my-social-app-188ed",
  storageBucket: "my-social-app-188ed.firebasestorage.app",
  messagingSenderId: "635606110220",
  appId: "1:635606110220:web:efad86fcc1b78efdfb5e29",
  measurementId: "G-692MB90CNB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function isFirebaseConfigured() {
  return true;
}

export { auth };
export type { User };

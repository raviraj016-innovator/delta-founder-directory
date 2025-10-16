import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, isSignInWithEmailLink, signInWithEmailLink, sendSignInLinkToEmail, getIdTokenResult } from 'firebase/auth';
import { Firestore, getFirestore, initializeFirestore, setLogLevel } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

export function getFirebaseApp() {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    // Reduce Firestore log noise in dev (e.g., WebChannel terminate 400 messages)
    try { setLogLevel('error'); } catch {}
    return app;
  }
  return getApp();
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  // persist session across tabs/reloads
  setPersistence(auth, browserLocalPersistence);
  return auth;
}

let _db: Firestore | null = null;
export function getDb() {
  if (_db) return _db;
  const app = getFirebaseApp();
  // Prefer long polling to avoid streaming channel terminate 400s in some environments
  try {
    _db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    _db = getFirestore(app);
  }
  return _db;
}

export async function startEmailLinkSignIn(email: string) {
  const auth = getFirebaseAuth();
  const actionCodeSettings = {
    url: `${window.location.origin}/login`, // handle on same page
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
}

export async function completeEmailLinkSignInIfPresent() {
  const auth = getFirebaseAuth();
  if (typeof window === 'undefined') return null;
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      // Ask user to provide the email used for sign-in
      email = window.prompt('Please provide your email for confirmation') || '';
    }
    const cred = await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem('emailForSignIn');
    return cred.user;
  }
  return null;
}

export async function isCurrentUserAdmin() {
  const auth = getFirebaseAuth();
  const u = auth.currentUser;
  if (!u) return false;
  const res = await getIdTokenResult(u, true);
  const claims = res.claims as Record<string, unknown>;
  return Boolean(claims.admin);
}

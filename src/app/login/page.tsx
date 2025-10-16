"use client";

import { useEffect, useState } from "react";
import { completeEmailLinkSignInIfPresent, startEmailLinkSignIn, getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || null);
        router.replace("/me");
      } else {
        setUserEmail(null);
      }
    });
    // Try to complete email link flow if present
    completeEmailLinkSignInIfPresent().catch((e) => {
      console.error(e);
    });
    return () => unsub();
  }, [router]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus("Sending sign-in link...");
      await startEmailLinkSignIn(email);
      setStatus("Sign-in link sent. Check your inbox/spam to complete sign in.");
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Failed to send link");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(getFirebaseAuth());
      setUserEmail(null);
      setStatus("Signed out");
    } catch (e: any) {
      setStatus(e?.message || "Failed to sign out");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      {userEmail ? (
        <div className="space-y-4">
          <p className="text-sm">You are signed in as {userEmail}</p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={handleSendLink} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded hover:opacity-90"
          >
            Send sign-in link
          </button>
        </form>
      )}
      {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
    </div>
  );
}

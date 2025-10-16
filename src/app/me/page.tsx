"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFounder } from "@/lib/firestore";

export default function MePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setEmail(user.email || null);
        const f = await getFounder(user.uid);
        setNeedsOnboarding(!(f && f.name));
      }
    });
    return () => unsub();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(getFirebaseAuth());
    router.replace("/login");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Account</h1>
      {email ? (
        <>
          <p className="text-sm text-gray-600">Signed in as {email}</p>
          <div className="flex gap-3 flex-wrap">
            <a
              href="/"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Go to Directory
            </a>
            <a
              href="/me/onboarding"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              {needsOnboarding ? "Complete Onboarding" : "Edit Profile"}
            </a>
            <a
              href="/me/startups"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              My Startups
            </a>
            <a
              href="/me/startups/new"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Add Startup
            </a>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Sign out
            </button>
          </div>
          {needsOnboarding && (
            <div className="mt-6 p-4 border rounded bg-yellow-50 text-sm">
              <p className="mb-2 font-medium">Complete your founder profile</p>
              <p className="text-gray-700">Finish onboarding so we can attribute your startups correctly.</p>
            </div>
          )}
          <div className="mt-8">
            <h2 className="text-xl font-medium mb-2">Next steps</h2>
            <ol className="list-decimal ml-6 space-y-1 text-sm text-gray-700">
              <li>We will add founder onboarding (profile) here.</li>
              <li>Then a flow to add/edit your startup.</li>
              <li>After submit, an admin will approve before it appears publicly.</li>
            </ol>
          </div>
        </>
      ) : (
        <p>Checking session...</p>
      )}
    </div>
  );
}

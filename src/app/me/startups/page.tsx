"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { fetchOwnedStartups } from "@/lib/firestore";
import { StartupDoc } from "@/types";
import { useRouter } from "next/navigation";

export default function MyStartupsPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<StartupDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoading(true);
      const list = await fetchOwnedStartups(uid);
      setItems(list);
      setLoading(false);
    })();
  }, [uid]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Startups</h1>
        <Link href="/me/startups/new" className="px-3 py-2 bg-black text-white rounded">
          Add startup
        </Link>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-600">No startups yet. Click "Add startup" to create your first.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className="border rounded p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-gray-600">Status: {s.status}</div>
              </div>
              <Link href={`/me/startups/${s.id}`} className="text-sm underline">Edit</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

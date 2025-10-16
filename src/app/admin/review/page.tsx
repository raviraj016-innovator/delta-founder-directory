"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth, isCurrentUserAdmin } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { approveStartup, fetchPendingStartups, rejectStartup } from "@/lib/firestore";
import { StartupDoc } from "@/types";
import { useRouter } from "next/navigation";

export default function AdminReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<StartupDoc[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const admin = await isCurrentUserAdmin();
      setIsAdmin(admin);
      if (!admin) {
        router.replace("/");
        return;
      }
      await reload();
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const reload = async () => {
    setLoading(true);
    const data = await fetchPendingStartups();
    setItems(data);
    setLoading(false);
  };

  const approve = async (id: string) => {
    setBusyId(id);
    await approveStartup(id);
    await reload();
    setBusyId(null);
  };
  const reject = async (id: string) => {
    setBusyId(id);
    await rejectStartup(id);
    await reload();
    setBusyId(null);
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Review</h1>
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-600">No pending startups.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className="border rounded p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-600">{s.oneLiner}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(s.id!)}
                    disabled={busyId === s.id}
                    className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(s.id!)}
                    disabled={busyId === s.id}
                    className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
              {s.description && <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{s.description}</p>}
              <div className="mt-2 text-xs text-gray-500 flex gap-3">
                {s.stage && <span>Stage: {s.stage}</span>}
                {s.location && <span>Location: {s.location}</span>}
                {s.tags && s.tags.length > 0 && <span>Tags: {s.tags.join(', ')}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

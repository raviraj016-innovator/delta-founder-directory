"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApprovedStartups, upvoteStartup } from "@/lib/firestore";
import { StartupDoc } from "@/types";
import { CATEGORIES, COUNTRIES } from "@/lib/constants";
import { getFirebaseAuth } from "@/lib/firebaseClient";


export default function Home() {
  const [items, setItems] = useState<StartupDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const data = await fetchApprovedStartups(q);
      // Client-side filters to avoid composite index explosion in MVP
      const filtered = data.filter((x) => {
        const matchStage = stage ? x.stage === stage : true;
        const matchCountry = country ? x.countryCode === country : true;
        const matchCategory = category ? (x.categories || []).includes(category) : true;
        return matchStage && matchCountry && matchCategory;
      });
      const sorted = filtered.slice().sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
      setItems(sorted);
      setLoading(false);
    };
    run();
  }, [q, stage, country, category]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const u = auth.currentUser;
    setCurrentUid(u?.uid || null);
    const unsub = auth.onAuthStateChanged?.((user) => setCurrentUid(user?.uid || null));
    return () => { unsub && unsub(); };
  }, []);

  const handleUpvote = async (id: string | undefined) => {
    if (!id) return;
    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("Please login to upvote");
      return;
    }
    try {
      await upvoteStartup(id, uid);
      setItems((prev) => {
        const next = prev.map((s) =>
          s.id === id
            ? { ...s, upvotesCount: (s.upvotesCount || 0) + 1, upvoterIds: [...(s.upvoterIds || []), uid] }
            : s
        );
        return next.slice().sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
    

      <div className="mb-4 flex flex-wrap md:flex-nowrap items-center gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search startups..."
          className="border rounded px-3 py-2 w-[320px] max-w-full"
        />
        <select value={stage} onChange={(e)=>setStage(e.target.value)} className="border rounded px-3 py-2 w-[180px] max-w-full">
          <option value="">All stages</option>
          <option value="idea">Idea</option>
          <option value="mvp">MVP</option>
          <option value="launched">Launched</option>
          <option value="growth">Growth</option>
        </select>
        <select value={country} onChange={(e)=>setCountry(e.target.value)} className="border rounded px-3 py-2 w-[200px] max-w-full">
          <option value="">All countries</option>
          {COUNTRIES.map((c)=> (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <select value={category} onChange={(e)=>setCategory(e.target.value)} className="border rounded px-3 py-2 w-[200px] max-w-full">
          <option value="">All categories</option>
          {CATEGORIES.map((c)=> (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No startups found.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <li key={s.id} className="border rounded p-4 bg-[var(--card)] text-[var(--foreground)]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/s/${s.slug}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                    <button
                      onClick={() => handleUpvote(s.id)}
                      className="text-xs px-2 py-0.5 rounded border bg-[var(--muted)] border-[var(--chip-border)]"
                      disabled={currentUid ? (s.upvoterIds || []).includes(currentUid) : false}
                      title="Upvote"
                    >
                      ▲ {s.upvotesCount || 0}
                    </button>
                  </div>
                  <p
                    className="text-sm mt-1 overflow-hidden text-ellipsis break-words text-[var(--foreground)]/80"
                    style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                    title={s.oneLiner}
                  >
                    {s.oneLiner}
                  </p>
                </div>
                {s.hiring && (
                  <span className="text-xs px-2 py-1 rounded bg-[var(--muted)] text-[var(--foreground)]/90 border border-[var(--chip-border)]">Hiring</span>
                )}
              </div>
              <div className="mt-2 text-xs flex flex-wrap gap-3 text-[var(--foreground)]/70">
                {s.stage && <span className="px-2 py-0.5 rounded bg-[var(--muted)] border border-[var(--chip-border)]">{s.stage}</span>}
                {s.countryCode && <span className="px-2 py-0.5 rounded bg-[var(--muted)] border border-[var(--chip-border)]">{s.countryCode}</span>}
                {Array.isArray(s.categories) && s.categories.slice(0,3).map((c)=> (
                  <span key={c} className="px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--foreground)]/90 border border-[var(--chip-border)]">{c}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

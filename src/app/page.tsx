"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApprovedStartups } from "@/lib/firestore";
import { StartupDoc } from "@/types";
import { CATEGORIES, COUNTRIES } from "@/lib/constants";


export default function Home() {
  const [items, setItems] = useState<StartupDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [category, setCategory] = useState<string>("");

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
      setItems(filtered);
      setLoading(false);
    };
    run();
  }, [q, stage, country, category]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">delta directory</h1>
        <nav className="flex gap-3 text-sm">
          <Link href="/login" className="underline">Login</Link>
          <Link href="/me" className="underline">My Account</Link>
        </nav>
      </header>

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
            <li key={s.id} className="border rounded p-4 bg-white/80">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link href={`/s/${s.slug}`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                  <p
                    className="text-sm text-gray-600 mt-1 overflow-hidden text-ellipsis break-words"
                    style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                    title={s.oneLiner}
                  >
                    {s.oneLiner}
                  </p>
                </div>
                {s.hiring && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Hiring</span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
                {s.stage && <span className="px-2 py-0.5 rounded bg-gray-100">{s.stage}</span>}
                {s.countryCode && <span className="px-2 py-0.5 rounded bg-gray-100">{s.countryCode}</span>}
                {Array.isArray(s.categories) && s.categories.slice(0,3).map((c)=> (
                  <span key={c} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">{c}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

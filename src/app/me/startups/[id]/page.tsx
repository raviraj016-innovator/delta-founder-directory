"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { fetchStartupById, updateStartup } from "@/lib/firestore";
import { StartupDoc, Stage } from "@/types";
import Link from "next/link";

export default function EditStartupPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [doc, setDoc] = useState<StartupDoc | null>(null);
  const [name, setName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState<Stage>("idea");
  const [hiring, setHiring] = useState(false);
  const [tags, setTags] = useState("");
  const [recentSocialPostUrl, setRecentSocialPostUrl] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const s = await fetchStartupById(id);
      if (!s) {
        router.replace("/me/startups");
        return;
      }
      setDoc(s);
      setName(s.name || "");
      setOneLiner(s.oneLiner || "");
      setDescription(s.description || "");
      setWebsiteUrl(s.websiteUrl || "");
      setLocation(s.location || "");
      setStage((s.stage as Stage) || "idea");
      setHiring(Boolean(s.hiring));
      setTags((s.tags || []).join(", "));
      setRecentSocialPostUrl(s.recentSocialPostUrl || "");
      setLoading(false);
    })();
  }, [id, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setErr(null);
    try {
      await updateStartup(id, {
        name,
        oneLiner,
        description,
        websiteUrl,
        location,
        stage,
        hiring,
        recentSocialPostUrl: recentSocialPostUrl || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      router.replace("/me/startups");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to update startup");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto p-6">Loading...</div>;
  if (!doc) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Startup</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Most recent social post URL (optional)</label>
          <input className="w-full border rounded px-3 py-2" value={recentSocialPostUrl} onChange={(e)=>setRecentSocialPostUrl(e.target.value)} placeholder="https://x.com/... or https://www.linkedin.com/posts/..." />
        </div>
        <div>
          <label className="block text-sm mb-1">One-liner</label>
          <input className="w-full border rounded px-3 py-2" value={oneLiner} onChange={(e)=>setOneLiner(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="w-full border rounded px-3 py-2" rows={5} value={description} onChange={(e)=>setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Website URL</label>
            <input className="w-full border rounded px-3 py-2" value={websiteUrl} onChange={(e)=>setWebsiteUrl(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Location</label>
            <input className="w-full border rounded px-3 py-2" value={location} onChange={(e)=>setLocation(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm mb-1">Stage</label>
            <select className="w-full border rounded px-3 py-2" value={stage} onChange={(e)=>setStage(e.target.value as Stage)}>
              <option value="idea">Idea</option>
              <option value="mvp">MVP</option>
              <option value="launched">Launched</option>
              <option value="growth">Growth</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="hiring" type="checkbox" checked={hiring} onChange={(e)=>setHiring(e.target.checked)} />
            <label htmlFor="hiring">Hiring</label>
          </div>
          <div>
            <label className="block text-sm mb-1">Tags (comma-separated)</label>
            <input className="w-full border rounded px-3 py-2" value={tags} onChange={(e)=>setTags(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={saving} className="px-4 py-2 bg-black text-white rounded disabled:opacity-60">{saving?"Saving...":"Save"}</button>
          <Link href="/me/startups" className="text-sm underline">Cancel</Link>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </div>
  );
}


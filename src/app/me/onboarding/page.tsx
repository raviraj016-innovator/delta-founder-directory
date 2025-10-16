"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { getFounder, upsertFounder, syncFounderToStartups } from "@/lib/firestore";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [x, setX] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [otherSocial, setOtherSocial] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      setEmail(user.email || null);
      const f = await getFounder(user.uid);
      if (f?.name) {
        setName(f.name);
      }
      if (f?.avatarUrl) setAvatarUrl(f.avatarUrl);
      if (f?.linkedin) setLinkedin(f.linkedin);
      if (f?.x) setX(f.x);
      if (f?.instagram) setInstagram(f.instagram);
      if (f?.website) setWebsite(f.website);
      if (f?.otherSocial) setOtherSocial(f.otherSocial);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    if (!avatarUrl || avatarUrl.trim().length === 0) {
      setErr("Please provide a founder image URL.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await upsertFounder(uid, { email: email || undefined, name, avatarUrl, linkedin, x, instagram, website, otherSocial });
      // Keep founders displayed on startup pages in sync automatically
      await syncFounderToStartups(uid);
      router.replace("/me");
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-xl mx-auto p-6">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Founder Onboarding</h1>
      <p className="text-sm text-gray-600 mb-4">Tell us a bit about you to complete your profile.</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Founder image URL (required)</label>
          <input className="w-full border rounded px-3 py-2" value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} required placeholder="https://..." />
          {avatarUrl && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Founder" className="w-14 h-14 rounded-full object-cover border" />
              <span className="text-xs text-gray-600">Preview</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">LinkedIn</label>
            <input className="w-full border rounded px-3 py-2" value={linkedin} onChange={(e)=>setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/..." />
          </div>
          <div>
            <label className="block text-sm mb-1">X (Twitter)</label>
            <input className="w-full border rounded px-3 py-2" value={x} onChange={(e)=>setX(e.target.value)} placeholder="https://x.com/username" />
          </div>
          <div>
            <label className="block text-sm mb-1">Instagram</label>
            <input className="w-full border rounded px-3 py-2" value={instagram} onChange={(e)=>setInstagram(e.target.value)} placeholder="https://instagram.com/username" />
          </div>
          <div>
            <label className="block text-sm mb-1">Website</label>
            <input className="w-full border rounded px-3 py-2" value={website} onChange={(e)=>setWebsite(e.target.value)} placeholder="https://yourdomain.com" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Other Social</label>
            <input className="w-full border rounded px-3 py-2" value={otherSocial} onChange={(e)=>setOtherSocial(e.target.value)} placeholder="Any other URL" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={saving} className="px-4 py-2 bg-black text-white rounded disabled:opacity-60">{saving?"Saving...":"Save profile"}</button>
          <a href="/me" className="text-sm underline">Skip for now</a>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </div>
  );
}

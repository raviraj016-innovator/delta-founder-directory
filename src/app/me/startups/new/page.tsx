"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { createStartup } from "@/lib/firestore";
import { slugify } from "@/lib/slug";
import { useRouter } from "next/navigation";
import { Stage } from "@/types";
import { getFounder, ensureUniqueSlug } from "@/lib/firestore";
import { CATEGORIES, COUNTRIES } from "@/lib/constants";

export default function NewStartupPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState<Stage>("idea");
  const [hiring, setHiring] = useState(false);
  const [tags, setTags] = useState("");
  const [demoVideoUrl, setDemoVideoUrl] = useState("");
  const [recentUpdatesText, setRecentUpdatesText] = useState("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [categoriesSelected, setCategoriesSelected] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [careersUrl, setCareersUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [startupLinkedin, setStartupLinkedin] = useState("");
  const [startupX, setStartupX] = useState("");
  const [startupInstagram, setStartupInstagram] = useState("");
  const [startupOther, setStartupOther] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setUid(user.uid);
      }
    });
    return () => unsub();
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    setErr(null);
    try {
      // Pull founder profile for denormalized public display on startup page
      const f = await getFounder(uid);
      const slug = await ensureUniqueSlug(name, uid);
      const id = await createStartup({
        name,
        oneLiner,
        description,
        websiteUrl,
        location,
        countryCode: countryCode || undefined,
        logoUrl: logoUrl || undefined,
        stage,
        hiring,
        status: "pending",
        ownerIds: [uid],
        slug,
        ownersPublic: [
          {
            uid,
            email: f?.email || undefined,
            name: f?.name || undefined,
            avatarUrl: f?.avatarUrl || undefined,
            linkedin: f?.linkedin || undefined,
            x: f?.x || undefined,
            instagram: f?.instagram || undefined,
            website: f?.website || undefined,
            otherSocial: f?.otherSocial || undefined,
          },
        ],
        demoVideoUrl: demoVideoUrl || undefined,
        recentUpdates: recentUpdatesText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        categories: categoriesSelected,
        careersUrl: careersUrl || undefined,
        contactEmail: contactEmail || undefined,
        socialLinkedin: startupLinkedin || undefined,
        socialX: startupX || undefined,
        socialInstagram: startupInstagram || undefined,
        socialOther: startupOther || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      router.replace("/me/startups");
    } catch (e: any) {
      setErr(e?.message || "Failed to create startup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Add Startup</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Startup LinkedIn (optional)</label>
            <input className="w-full border rounded px-3 py-2" value={startupLinkedin} onChange={(e)=>setStartupLinkedin(e.target.value)} placeholder="https://www.linkedin.com/company/..." />
          </div>
          <div>
            <label className="block text-sm mb-1">Startup X/Twitter (optional)</label>
            <input className="w-full border rounded px-3 py-2" value={startupX} onChange={(e)=>setStartupX(e.target.value)} placeholder="https://x.com/yourcompany" />
          </div>
          <div>
            <label className="block text-sm mb-1">Startup Instagram (optional)</label>
            <input className="w-full border rounded px-3 py-2" value={startupInstagram} onChange={(e)=>setStartupInstagram(e.target.value)} placeholder="https://instagram.com/yourcompany" />
          </div>
          <div>
            <label className="block text-sm mb-1">Startup Other social (optional)</label>
            <input className="w-full border rounded px-3 py-2" value={startupOther} onChange={(e)=>setStartupOther(e.target.value)} placeholder="Any other URL" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Logo URL (optional)</label>
            <input className="w-full border rounded px-3 py-2" value={logoUrl} onChange={(e)=>setLogoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm mb-1">Careers URL (optional)</label>
            <input className="w-full border rounded px-3 py-2" value={careersUrl} onChange={(e)=>setCareersUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Contact email (optional)</label>
            <input className="w-full border rounded px-3 py-2" type="email" value={contactEmail} onChange={(e)=>setContactEmail(e.target.value)} placeholder="founder@company.com" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Demo video URL (optional)</label>
          <input className="w-full border rounded px-3 py-2" value={demoVideoUrl} onChange={(e)=>setDemoVideoUrl(e.target.value)} placeholder="YouTube/Vimeo/any URL" />
        </div>
        <div>
          <label className="block text-sm mb-1">Recent updates (one per line)</label>
          <textarea className="w-full border rounded px-3 py-2" rows={4} value={recentUpdatesText} onChange={(e)=>setRecentUpdatesText(e.target.value)} placeholder="Launched v1\nClosed first customer\nHiring founding engineer" />
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
          <div>
            <label className="block text-sm mb-1">Country</label>
            <select className="w-full border rounded px-3 py-2" value={countryCode} onChange={(e)=>setCountryCode(e.target.value)}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
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
        <div>
          <label className="block text-sm mb-2">Categories (select all that apply)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const checked = categoriesSelected.includes(c);
              return (
                <label key={c} className="flex items-center gap-2 text-sm border rounded px-2 py-1 bg-white">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e)=> {
                      setCategoriesSelected((prev) => e.target.checked ? [...prev, c] : prev.filter((x)=>x!==c));
                    }}
                  />
                  <span>{c}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={saving} className="px-4 py-2 bg-black text-white rounded disabled:opacity-60">{saving?"Saving...":"Create"}</button>
          <a href="/me/startups" className="text-sm underline">Cancel</a>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </div>
  );
}

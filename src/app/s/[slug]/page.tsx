"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchStartupBySlug } from "@/lib/firestore";
import { StartupDoc } from "@/types";

export default function StartupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "";
  const [item, setItem] = useState<StartupDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const s = await fetchStartupBySlug(slug);
      if (!s) {
        router.replace("/");
        return;
      }
      setItem(s);
      setLoading(false);
    })();
  }, [slug, router]);

  if (loading) return <div className="max-w-3xl mx-auto p-6">Loading...</div>;
  if (!item) return null;

  const toEmbedUrl = (url: string) => {
    if (!url) return null;
    // YouTube
    const ytWatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;
    // Vimeo
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return url;
  };
  const embedUrl = toEmbedUrl(item.demoVideoUrl || "");
  const normalizeUrl = (url?: string) => {
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <Link href="/" className="text-sm underline">← Back to Directory</Link>
      <h1 className="text-3xl font-semibold break-words">{item.name}</h1>
      {item.recentSocialPostUrl && (
        <p className="text-sm mt-1">
          <a
            href={item.recentSocialPostUrl}
            target="_blank"
            rel="noreferrer"
            className="underline text-blue-700"
          >
            Latest post ↗
          </a>
        </p>
      )}
      <p className="text-gray-700 break-words">{item.oneLiner}</p>
      {item.description && <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{item.description}</p>}
      <div className="text-sm text-gray-600 flex gap-4">
        {item.location && <span>Location: {item.location}</span>}
        {item.stage && <span>Stage: {item.stage}</span>}
        {item.hiring && <span className="text-green-700">Hiring</span>}
      </div>
      {Array.isArray(item.ownersPublic) && item.ownersPublic.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-medium mb-3">Founders</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {item.ownersPublic.map((o) => (
              <li key={o.uid} className="border rounded p-3 flex items-center gap-3">
                {o.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.avatarUrl} alt={o.name || o.email || "Founder"} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                    {o.name?.[0]?.toUpperCase() || "F"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{o.name || "Founder"}</div>
                  {o.email && (
                    <a href={`mailto:${o.email}`} className="text-xs text-gray-600 hover:underline truncate">
                      {o.email}
                    </a>
                  )}
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {o.linkedin && (
                      <a href={o.linkedin} target="_blank" rel="noreferrer" className="underline">LinkedIn</a>
                    )}
                    {o.x && (
                      <a href={o.x} target="_blank" rel="noreferrer" className="underline">X</a>
                    )}
                    {o.instagram && (
                      <a href={o.instagram} target="_blank" rel="noreferrer" className="underline">Instagram</a>
                    )}
                    {o.website && (
                      <a href={o.website} target="_blank" rel="noreferrer" className="underline">Website</a>
                    )}
                    {o.otherSocial && (
                      <a href={o.otherSocial} target="_blank" rel="noreferrer" className="underline">Other</a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {item.demoVideoUrl && (
        <section className="mt-6 space-y-2">
          <h2 className="text-lg font-medium">Demo video</h2>
          <div className="aspect-video w-full max-w-3xl bg-black/5">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full rounded"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <a href={item.demoVideoUrl} target="_blank" rel="noreferrer" className="underline break-words">Open demo video</a>
            )}
          </div>
        </section>
      )}
      {Array.isArray(item.recentUpdates) && item.recentUpdates.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-medium mb-2">Recent updates</h2>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
            {item.recentUpdates.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </section>
      )}
      {item.websiteUrl && (
        <a
          href={normalizeUrl(item.websiteUrl)}
          target="_blank"
          rel="noreferrer"
          className="visit-btn inline-block px-4 py-2 rounded border bg-[var(--muted)] text-[color:rgb(17,17,17)] border-[var(--chip-border)]"
        >
          Visit website
        </a>
      )}
    </div>
  );
}


import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, updateDoc, where, addDoc } from 'firebase/firestore';
import { getDb } from './firebaseClient';
import { StartupDoc, FounderDoc, OwnerPublicInfo } from '@/types';
import { slugify } from './slug';

function pruneUndefinedDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    // @ts-ignore
    return obj
      .map((v) => pruneUndefinedDeep(v))
      .filter((v) => v !== undefined && v !== null) as any;
  } else if (obj && typeof obj === 'object') {
    const out: any = {};
    Object.entries(obj as any).forEach(([k, v]) => {
      const pv = pruneUndefinedDeep(v as any);
      if (pv !== undefined) out[k] = pv;
    });
    return out;
  }
  return obj;
}

// Sync the latest founder public info into all startups owned by uid
export async function syncFounderToStartups(uid: string) {
  const db = getDb();
  const founder = await getFounder(uid);
  if (!founder) return;
  const ref = collection(db, 'startups');
  const q = query(ref, where('ownerIds', 'array-contains', uid));
  const snap = await getDocs(q);
  const pub: OwnerPublicInfo = {
    uid,
    email: founder.email,
    name: founder.name,
    avatarUrl: founder.avatarUrl,
    linkedin: founder.linkedin,
    x: founder.x,
    instagram: founder.instagram,
    website: founder.website,
    otherSocial: founder.otherSocial,
  };
  for (const d of snap.docs) {
    const curr = (d.data() as any).ownersPublic as OwnerPublicInfo[] | undefined;
    let next: OwnerPublicInfo[] = Array.isArray(curr) ? curr.slice() : [];
    const idx = next.findIndex((o) => o.uid === uid);
    if (idx >= 0) {
      next[idx] = { ...next[idx], ...pub };
    } else {
      next.push(pub);
    }
    const clean = pruneUndefinedDeep({ ownersPublic: next, updatedAt: Date.now() });
    await updateDoc(doc(db, 'startups', d.id), clean as any);
  }
}

export async function fetchApprovedStartups(search?: string) {
  const db = getDb();
  const ref = collection(db, 'startups');
  let q = query(ref, where('status', '==', 'approved'), orderBy('name'));
  const snap = await getDocs(q);
  let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as StartupDoc));
  if (search && search.trim().length > 0) {
    const s = search.toLowerCase();
    items = items.filter(x => (x.name || '').toLowerCase().includes(s) || (x.oneLiner || '').toLowerCase().includes(s));
  }
  return items;
}

export async function fetchStartupBySlug(slug: string) {
  const db = getDb();
  const ref = collection(db, 'startups');
  // Include status filter so the query satisfies security rules for anonymous users
  const q = query(ref, where('slug', '==', slug), where('status', '==', 'approved'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as any) } as StartupDoc;
}

export async function fetchStartupById(id: string) {
  const db = getDb();
  const ref = doc(db, 'startups', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as StartupDoc;
}

export async function createStartup(data: Omit<StartupDoc, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  const ref = collection(db, 'startups');
  const now = Date.now();
  const payload: StartupDoc = { ...data, createdAt: now, updatedAt: now } as StartupDoc;
  const clean = pruneUndefinedDeep(payload);
  const res = await addDoc(ref, clean as any);
  return res.id;
}

export async function updateStartup(id: string, data: Partial<StartupDoc>) {
  const db = getDb();
  const ref = doc(db, 'startups', id);
  const clean = pruneUndefinedDeep({ ...data, updatedAt: Date.now() });
  await updateDoc(ref, clean as any);
}

export async function approveStartup(id: string) {
  const db = getDb();
  const ref = doc(db, 'startups', id);
  await updateDoc(ref, { status: 'approved' } as any);
}

export async function rejectStartup(id: string) {
  const db = getDb();
  const ref = doc(db, 'startups', id);
  await updateDoc(ref, { status: 'rejected' } as any);
}

export async function fetchPendingStartups() {
  const db = getDb();
  const ref = collection(db, 'startups');
  const q = query(ref, where('status', '==', 'pending'), orderBy('createdAt'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as StartupDoc));
}

export async function fetchOwnedStartups(uid: string) {
  const db = getDb();
  const ref = collection(db, 'startups');
  const q = query(ref, where('ownerIds', 'array-contains', uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as StartupDoc));
}

// Founder profile helpers
export async function getFounder(uid: string) {
  const db = getDb();
  const ref = doc(db, 'founders', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as FounderDoc) : null;
}

export async function upsertFounder(uid: string, data: Partial<FounderDoc>) {
  const db = getDb();
  const ref = doc(db, 'founders', uid);
  const prev = await getDoc(ref);
  const payload: Partial<FounderDoc> = {
    ... (prev.exists() ? (prev.data() as any) : {}),
    ...data,
    email: data.email || (prev.exists() ? (prev.data() as any).email : undefined),
    createdAt: prev.exists() ? (prev.data() as any).createdAt : Date.now(),
  };
  await setDoc(ref, payload as any);
}

// Ensure slug uniqueness by appending incremental suffix if needed
export async function ensureUniqueSlug(baseName: string, uid: string) {
  const db = getDb();
  const base = slugify(baseName);
  let candidate = base;
  let i = 2;
  while (true) {
    const ref = collection(db, 'startups');
    // Query only docs readable by current user: approved OR owned by user
    const qApproved = query(ref, where('slug', '==', candidate), where('status', '==', 'approved'), limit(1));
    const qOwned = query(ref, where('slug', '==', candidate), where('ownerIds', 'array-contains', uid), limit(1));
    const [snapApproved, snapOwned] = await Promise.all([getDocs(qApproved), getDocs(qOwned)]);
    if (snapApproved.empty && snapOwned.empty) return candidate;
    candidate = `${base}-${i++}`;
  }
}

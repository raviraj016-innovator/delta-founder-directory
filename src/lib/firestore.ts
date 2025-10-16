import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where, addDoc, DocumentData, CollectionReference, DocumentReference, runTransaction, arrayUnion } from 'firebase/firestore';
import { getDb } from './firebaseClient';
import { StartupDoc, FounderDoc, OwnerPublicInfo } from '@/types';
import { slugify } from './slug';

function pruneUndefinedDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    const arr = (obj as unknown[])
      .map((v) => pruneUndefinedDeep(v as unknown))
      .filter((v) => v !== undefined && v !== null);
    return arr as unknown as T;
  } else if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      const pv = pruneUndefinedDeep(v as unknown);
      if (pv !== undefined) {
        out[k] = pv as unknown;
      }
    });
    return out as unknown as T;
  }
  return obj;
}

// Sync the latest founder public info into all startups owned by uid
export async function syncFounderToStartups(uid: string) {
  const db = getDb();
  const founder = await getFounder(uid);
  if (!founder) return;
  const ref = collection(db, 'startups') as CollectionReference<StartupDoc>;
  const qOwned = query(ref, where('ownerIds', 'array-contains', uid));
  const snap = await getDocs(qOwned);
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
    const curr = d.data().ownersPublic as OwnerPublicInfo[] | undefined;
    const next: OwnerPublicInfo[] = Array.isArray(curr) ? curr.slice() : [];
    const idx = next.findIndex((o) => o.uid === uid);
    if (idx >= 0) {
      next[idx] = { ...next[idx], ...pub };
    } else {
      next.push(pub);
    }
    const clean = pruneUndefinedDeep({ ownersPublic: next, updatedAt: Date.now() }) as Partial<StartupDoc>;
    await updateDoc(doc(db, 'startups', d.id) as DocumentReference<StartupDoc>, clean);
  }
}

export async function fetchApprovedStartups(search?: string) {
  const db = getDb();
  const ref = collection(db, 'startups') as CollectionReference<StartupDoc>;
  const qApproved = query(ref, where('status', '==', 'approved'), orderBy('name'));
  const snap = await getDocs(qApproved);
  let items: StartupDoc[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (search && search.trim().length > 0) {
    const s = search.toLowerCase();
    items = items.filter(x => (x.name || '').toLowerCase().includes(s) || (x.oneLiner || '').toLowerCase().includes(s));
  }
  return items;
}

export async function fetchStartupBySlug(slug: string) {
  const db = getDb();
  const ref = collection(db, 'startups') as CollectionReference<StartupDoc>;
  // Include status filter so the query satisfies security rules for anonymous users
  const qBySlug = query(ref, where('slug', '==', slug), where('status', '==', 'approved'), limit(1));
  const snap = await getDocs(qBySlug);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as StartupDoc;
}

export async function fetchStartupById(id: string) {
  const db = getDb();
  const ref = doc(db, 'startups', id) as DocumentReference<DocumentData>;
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as DocumentData) } as StartupDoc;
}

export async function createStartup(data: Omit<StartupDoc, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  const ref = collection(db, 'startups') as CollectionReference<StartupDoc>;
  const now = Date.now();
  const payload: StartupDoc = { ...data, createdAt: now, updatedAt: now } as StartupDoc;
  const clean = pruneUndefinedDeep(payload) as StartupDoc;
  const res = await addDoc(ref, clean);
  return res.id;
}

export async function updateStartup(id: string, data: Partial<StartupDoc>) {
  const db = getDb();
  const ref = doc(db, 'startups', id) as DocumentReference<StartupDoc>;
  const clean = pruneUndefinedDeep({ ...data, updatedAt: Date.now() }) as Partial<StartupDoc>;
  await updateDoc(ref, clean);
}

export async function approveStartup(id: string) {
  const db = getDb();
  const ref = doc(db, 'startups', id) as DocumentReference<StartupDoc>;
  await updateDoc(ref, { status: 'approved' } as Partial<StartupDoc>);
}

export async function rejectStartup(id: string) {
  const db = getDb();
  const ref = doc(db, 'startups', id) as DocumentReference<StartupDoc>;
  await updateDoc(ref, { status: 'rejected' } as Partial<StartupDoc>);
}

export async function fetchPendingStartups() {
  const db = getDb();
  const ref = collection(db, 'startups') as CollectionReference<StartupDoc>;
  const qPending = query(ref, where('status', '==', 'pending'), orderBy('createdAt'));
  const snap = await getDocs(qPending);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchOwnedStartups(uid: string) {
  const db = getDb();
  const ref = collection(db, 'startups') as CollectionReference<StartupDoc>;
  const qOwned = query(ref, where('ownerIds', 'array-contains', uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(qOwned);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Founder profile helpers
export async function getFounder(uid: string) {
  const db = getDb();
  const ref = doc(db, 'founders', uid) as DocumentReference<DocumentData>;
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as FounderDoc) : null;
}

export async function upsertFounder(uid: string, data: Partial<FounderDoc>) {
  const db = getDb();
  const ref = doc(db, 'founders', uid) as DocumentReference<FounderDoc>;
  const prev = await getDoc(ref);
  const payload: Partial<FounderDoc> = {
    ... (prev.exists() ? (prev.data() as FounderDoc) : {}),
    ...data,
    email: data.email || (prev.exists() ? (prev.data() as FounderDoc).email : undefined),
    createdAt: prev.exists() ? (prev.data() as FounderDoc).createdAt! : Date.now(),
  };
  await setDoc(ref, payload as Partial<FounderDoc>);
}

// Ensure slug uniqueness by appending incremental suffix if needed
export async function ensureUniqueSlug(baseName: string, uid: string) {
  const db = getDb();
  const base = slugify(baseName);
  let candidate = base;
  let i = 2;
  while (true) {
    const ref = collection(db, 'startups') as CollectionReference<StartupDoc>;
    // Query only docs readable by current user: approved OR owned by user
    const qApproved = query(ref, where('slug', '==', candidate), where('status', '==', 'approved'), limit(1));
    const qOwned = query(ref, where('slug', '==', candidate), where('ownerIds', 'array-contains', uid), limit(1));
    const [snapApproved, snapOwned] = await Promise.all([getDocs(qApproved), getDocs(qOwned)]);
    if (snapApproved.empty && snapOwned.empty) return candidate;
    candidate = `${base}-${i++}`;
  }
}

export async function upvoteStartup(id: string, uid: string) {
  const db = getDb();
  const ref = doc(db, 'startups', id) as DocumentReference<StartupDoc>;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('not-found');
    const data = snap.data() as StartupDoc;
    const currIds = Array.isArray(data.upvoterIds) ? data.upvoterIds : [];
    if (currIds.includes(uid)) return;
    const nextIds = arrayUnion(uid) as unknown as string[];
    const nextCount = currIds.length + 1;
    tx.update(ref, { upvoterIds: nextIds as unknown, upvotesCount: nextCount, updatedAt: Date.now() } as Partial<StartupDoc>);
  });
}

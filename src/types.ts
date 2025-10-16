export type Stage = 'idea' | 'mvp' | 'launched' | 'growth';
export type Status = 'pending' | 'approved' | 'rejected';

export interface FounderDoc {
  email: string;
  name?: string;
  avatarUrl?: string;
  linkedin?: string;
  x?: string;
  instagram?: string;
  website?: string;
  otherSocial?: string;
  createdAt: number;
}

export interface OwnerPublicInfo {
  uid: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  linkedin?: string;
  x?: string;
  instagram?: string;
  website?: string;
  otherSocial?: string;
}

export interface StartupDoc {
  id?: string;
  name: string;
  oneLiner: string;
  description?: string;
  websiteUrl?: string;
  location?: string;
  countryCode?: string; // ISO alpha-2
  logoUrl?: string;
  // Startup socials
  socialLinkedin?: string;
  socialX?: string;
  socialInstagram?: string;
  socialOther?: string;
  stage: Stage;
  hiring: boolean;
  status: Status;
  ownerIds: string[];
  slug: string;
  tags?: string[];
  categories?: string[];
  ownersPublic?: OwnerPublicInfo[];
  demoVideoUrl?: string;
  recentUpdates?: string[];
  recentSocialPostUrl?: string;
  careersUrl?: string;
  contactEmail?: string;
  createdAt: number;
  updatedAt: number;
}

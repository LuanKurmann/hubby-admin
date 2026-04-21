export interface Club {
  id: string;
  name: string;
  logo: string;
  color: string;
  members: number;
  role: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  category: string;
  coach: string;
  coachId?: string;
  short: string;
  memberCount: number;
  season: { games: number; w: number; d: number; l: number };
}

export interface Role {
  id: string;
  name: string;
  description: string;
  users: number;
  system: boolean;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  teams: string[];
  roleIds: string[];
  paid: boolean;
  dueAmount: number;
  birthDate: string;
  address: string;
  city: string;
  zip: string;
  lastLogin: string;
  attendance: number;
  joined: string;
  gender: 'f' | 'm';
}

export interface CalendarEvent {
  id: string;
  type: 'training' | 'match' | 'event';
  title: string;
  team: string | null;
  start: Date;
  duration: number;
  location: string;
  confirmed: number;
  declined: number;
  pending: number;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  team: string | null;
  publishedAt: Date;
  views: number;
  author: string;
  cover: string;
  type?: string;
}

export interface ActivityItem {
  id: string;
  icon: string;
  color: string;
  text: string;
  minsAgo: number;
  live?: boolean;
}

export interface User {
  name: string;
  email: string;
}

export interface Tweaks {
  theme: 'light' | 'dark';
  density: 'compact' | 'comfortable' | 'spacious';
  primaryColor: string;
}

export interface InviteCode {
  id: string;
  code: string;
  roleIds: string[];
  teamId: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  note: string;
  createdAt: Date;
  createdBy: string;
  status: 'active' | 'revoked';
}

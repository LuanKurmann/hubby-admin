import { Injectable, signal } from '@angular/core';
import { Club, Team, Role, Member, CalendarEvent, NewsItem, ActivityItem, InviteCode } from '../models';

const CH_FIRST_M = ['Luca','Noah','Leon','Liam','Elias','Nino','Jonas','Matteo','Fabio','Nico','Samuel','David','Tim','Lars','Jan','Silvan','Cedric','Livio','Kevin','Marco','Patrick','Michael','Stefan','Thomas','Andreas','Daniel','Roger','Urs','Hans','Beat','Reto','Bruno','Walter','Peter','Markus','Christian','Benjamin','Alessandro','Raphael','Simon','Dario','Gian','Flavio','Remo','Sandro','Pascal','Adrian','Roman','Yannick','Manuel','Kilian','Tobias','Oliver','Philipp','Florian'];
const CH_FIRST_F = ['Lea','Mia','Lara','Lina','Elena','Anna','Sara','Laura','Lena','Nora','Julia','Sophia','Emma','Chiara','Alessia','Vanessa','Jana','Nadine','Fabienne','Ramona','Sabrina','Melanie','Nicole','Andrea','Corinne','Monika','Beatrice','Claudia','Barbara','Ursula'];
const CH_LAST = ['Müller','Meier','Schmid','Keller','Weber','Huber','Schneider','Meyer','Steiner','Fischer','Widmer','Brunner','Gerber','Baumann','Frei','Zimmermann','Moser','Graf','Wyss','Lüthi','Roth','Hofmann','Bachmann','Kunz','Suter','Bieri','Küng','Zbinden','Bühlmann','Portmann','Schwarz','Häfliger','Odermatt','Marti','Kaufmann','Schürch','Rüegg','Furrer','Hess','Aeschbacher','Bernasconi','Rossi','Bianchi','Ferrari','Conti','Amstutz','Flückiger','Inauen','Studer','Wenger','Aebi','Arnold','Eggenberger'];

function seed(n: number) {
  let s = n;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
const rnd = seed(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

function dateOffset(days: number, h = 19, m = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d;
}

@Injectable({ providedIn: 'root' })
export class MockDataService {
  readonly clubs = signal<Club[]>([
    { id: 'c1', name: 'FC Seedorf', logo: 'FCS', color: '#DC2626', members: 168, role: 'Präsident' },
    { id: 'c2', name: 'STV Altdorf', logo: 'STV', color: '#2563EB', members: 92, role: 'Trainer' },
  ]);

  addClub(c: Club): void {
    this.clubs.update(list => [...list, c]);
  }

  readonly teams: Team[] = [
    { id: 't1', name: '1. Mannschaft', color: '#DC2626', category: 'Aktive', coach: 'Roger Federer', short: '1.M', memberCount: 0, season: { games: 18, w: 11, d: 4, l: 3 } },
    { id: 't2', name: '2. Mannschaft', color: '#EA580C', category: 'Aktive', coach: 'Thomas Müller', short: '2.M', memberCount: 0, season: { games: 17, w: 7, d: 5, l: 5 } },
    { id: 't3', name: 'Senioren 30+', color: '#7C3AED', category: 'Senioren', coach: 'Peter Hofmann', short: 'S30', memberCount: 0, season: { games: 12, w: 6, d: 3, l: 3 } },
    { id: 't4', name: 'Junioren U17', color: '#2563EB', category: 'Junioren', coach: 'Silvan Widmer', short: 'U17', memberCount: 0, season: { games: 16, w: 9, d: 3, l: 4 } },
    { id: 't5', name: 'Junioren U15', color: '#0891B2', category: 'Junioren', coach: 'Kilian Graf', short: 'U15', memberCount: 0, season: { games: 14, w: 8, d: 2, l: 4 } },
    { id: 't6', name: 'Junioren U13', color: '#059669', category: 'Junioren', coach: 'Jana Meier', short: 'U13', memberCount: 0, season: { games: 10, w: 6, d: 2, l: 2 } },
    { id: 't7', name: 'Junioren U11', color: '#65A30D', category: 'Kinder', coach: 'Nadine Brunner', short: 'U11', memberCount: 0, season: { games: 8, w: 5, d: 1, l: 2 } },
    { id: 't8', name: 'Damen FF1', color: '#DB2777', category: 'Damen', coach: 'Corinne Keller', short: 'FF1', memberCount: 0, season: { games: 14, w: 8, d: 2, l: 4 } },
  ];

  readonly roles: Role[] = [
    { id: 'r1', name: 'Präsident', description: 'Vollzugriff auf alle Bereiche', users: 1, system: true },
    { id: 'r2', name: 'Kassier', description: 'Finanzen, Beiträge, Mitglieder sehen', users: 1, system: true },
    { id: 'r3', name: 'Aktuar', description: 'Mitglieder, News, Events', users: 1, system: true },
    { id: 'r4', name: 'Trainer', description: 'Eigenes Team, Events, Anwesenheit', users: 8, system: true },
    { id: 'r5', name: 'Aktivmitglied', description: 'Teilnahme, eigene Daten', users: 134, system: true },
    { id: 'r6', name: 'Passivmitglied', description: 'News und Events lesen', users: 23, system: false },
    { id: 'r7', name: 'Materialwart', description: 'Nur Events einsehen', users: 2, system: false },
  ];

  readonly members: Member[] = (() => {
    const result: Member[] = [];
    for (let i = 0; i < 150; i++) {
      const isF = rnd() < 0.28;
      const first = isF ? pick(CH_FIRST_F) : pick(CH_FIRST_M);
      const last = pick(CH_LAST);
      const memberTeams: string[] = [];
      const nTeams = rnd() < 0.2 ? 2 : 1;
      for (let j = 0; j < nTeams; j++) {
        const t = pick(this.teams);
        if (!memberTeams.includes(t.id)) memberTeams.push(t.id);
      }
      const primaryIdx = i < 1 ? 0 : i < 2 ? 1 : i < 3 ? 2 : i < 11 ? 3 : rnd() < 0.15 ? 5 : 4;
      const memberRoleIds: string[] = [this.roles[primaryIdx].id];
      if (rnd() < 0.18) {
        const extra = this.roles[Math.floor(rnd() * this.roles.length)].id;
        if (!memberRoleIds.includes(extra)) memberRoleIds.push(extra);
      }
      if (rnd() < 0.06) {
        const extra2 = this.roles[Math.floor(rnd() * this.roles.length)].id;
        if (!memberRoleIds.includes(extra2)) memberRoleIds.push(extra2);
      }
      const paid = rnd() < 0.74;
      const daysSince = Math.floor(rnd() * 60);
      result.push({
        id: `m${i + 1}`,
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')}@example.ch`,
        phone: `+41 7${Math.floor(rnd()*9)} ${String(Math.floor(rnd()*900)+100)} ${String(Math.floor(rnd()*90)+10)} ${String(Math.floor(rnd()*90)+10)}`,
        teams: memberTeams,
        roleIds: memberRoleIds,
        paid,
        dueAmount: paid ? 0 : [150, 200, 250, 400][Math.floor(rnd()*4)],
        birthDate: `${String(Math.floor(rnd()*28)+1).padStart(2,'0')}.${String(Math.floor(rnd()*12)+1).padStart(2,'0')}.${1960 + Math.floor(rnd()*55)}`,
        address: `${pick(['Bahnhofstrasse','Dorfstrasse','Hauptstrasse','Seestrasse','Kirchweg','Feldweg','Schulhausstrasse'])} ${Math.floor(rnd()*80)+1}`,
        city: pick(['Seedorf','Uri','Altdorf','Erstfeld','Bürglen','Attinghausen','Silenen']),
        zip: ['6462','6460','6472','6472','6463'][Math.floor(rnd()*5)],
        lastLogin: daysSince === 0 ? 'Heute' : daysSince === 1 ? 'Gestern' : `vor ${daysSince} Tagen`,
        attendance: Math.floor(rnd() * 45) + 55,
        joined: `${String(Math.floor(rnd()*28)+1).padStart(2,'0')}.${String(Math.floor(rnd()*12)+1).padStart(2,'0')}.20${String(Math.floor(rnd()*15)+10)}`,
        gender: isF ? 'f' : 'm',
      });
    }
    // Assign coaches
    this.teams.forEach((t, i) => {
      const trainerMember = result[3 + i] || result[3];
      t.coachId = trainerMember.id;
      t.coach = `${trainerMember.firstName} ${trainerMember.lastName}`;
      t.memberCount = result.filter(m => m.teams.includes(t.id)).length;
    });
    // Recompute role user counts based on actual roleIds
    this.roles.forEach(r => {
      r.users = result.filter(m => m.roleIds.includes(r.id)).length;
    });
    return result;
  })();

  readonly events: CalendarEvent[] = [
    { id: 'e1', type: 'training', title: 'Training 1. Mannschaft', team: 't1', start: dateOffset(1, 19, 30), duration: 90, location: 'Sportplatz Rüttigasse, Seedorf', confirmed: 14, declined: 3, pending: 5 },
    { id: 'e2', type: 'match', title: 'FC Seedorf vs. FC Altdorf', team: 't1', start: dateOffset(3, 15, 0), duration: 120, location: 'Sportplatz Rüttigasse, Seedorf', confirmed: 18, declined: 1, pending: 3 },
    { id: 'e3', type: 'training', title: 'Training U15', team: 't5', start: dateOffset(1, 17, 30), duration: 75, location: 'Sportplatz Rüttigasse, Seedorf', confirmed: 12, declined: 2, pending: 4 },
    { id: 'e4', type: 'match', title: 'U17 vs. SC Erstfeld', team: 't4', start: dateOffset(4, 14, 0), duration: 120, location: 'Sportplatz Erstfeld', confirmed: 15, declined: 2, pending: 3 },
    { id: 'e5', type: 'event', title: 'Vereinsversammlung', team: null, start: dateOffset(7, 19, 0), duration: 180, location: 'Restaurant Kreuz, Seedorf', confirmed: 47, declined: 8, pending: 22 },
    { id: 'e6', type: 'training', title: 'Training Senioren', team: 't3', start: dateOffset(2, 20, 0), duration: 90, location: 'Sportplatz Rüttigasse, Seedorf', confirmed: 9, declined: 4, pending: 3 },
    { id: 'e7', type: 'training', title: 'Training U13', team: 't6', start: dateOffset(0, 17, 0), duration: 60, location: 'Sportplatz Rüttigasse, Seedorf', confirmed: 11, declined: 1, pending: 2 },
    { id: 'e8', type: 'match', title: 'Damen FF1 vs. FC Schattdorf', team: 't8', start: dateOffset(5, 13, 30), duration: 120, location: 'Sportplatz Schattdorf', confirmed: 13, declined: 3, pending: 2 },
    { id: 'e9', type: 'training', title: 'Training 2. Mannschaft', team: 't2', start: dateOffset(1, 20, 0), duration: 90, location: 'Sportplatz Rüttigasse, Seedorf', confirmed: 13, declined: 4, pending: 6 },
    { id: 'e10', type: 'event', title: 'Grümpelturnier', team: null, start: dateOffset(14, 10, 0), duration: 480, location: 'Sportplatz Rüttigasse, Seedorf', confirmed: 28, declined: 5, pending: 40 },
    { id: 'e11', type: 'training', title: 'Training U11', team: 't7', start: dateOffset(2, 17, 0), duration: 60, location: 'Sportplatz Rüttigasse, Seedorf', confirmed: 14, declined: 2, pending: 2 },
    { id: 'e12', type: 'match', title: 'U15 vs. FC Bürglen', team: 't5', start: dateOffset(6, 10, 30), duration: 90, location: 'Sportplatz Bürglen', confirmed: 10, declined: 2, pending: 4 },
  ];

  readonly news: NewsItem[] = [
    { id: 'n1', title: '1. Mannschaft gewinnt Derby 3:1', excerpt: 'In einem packenden Spiel setzte sich unsere Erste gegen den FC Altdorf durch. Doppeltorschütze Dario Rossi...', team: 't1', publishedAt: dateOffset(-2, 20, 15), views: 234, author: 'Roger Federer', cover: 'match', type: 'match' },
    { id: 'n2', title: 'Neue Trainingskleider eingetroffen', excerpt: 'Ab sofort können die neuen Trainingskleider in der Vereinsgeschäftsstelle abgeholt werden.', team: null, publishedAt: dateOffset(-4, 10, 0), views: 412, author: 'Vereinsvorstand', cover: 'news' },
    { id: 'n3', title: 'Generalversammlung 2026 – Einladung', excerpt: 'Wir laden alle Mitglieder zur ordentlichen Generalversammlung am 28. April ein.', team: null, publishedAt: dateOffset(-6, 14, 30), views: 578, author: 'Aktuar', cover: 'news' },
    { id: 'n4', title: 'U15 holt Turniersieg in Schwyz', excerpt: 'Mit starken Leistungen hat unsere U15 das Frühjahrsturnier in Schwyz gewonnen.', team: 't5', publishedAt: dateOffset(-8, 18, 45), views: 189, author: 'Kilian Graf', cover: 'match', type: 'match' },
    { id: 'n5', title: 'Danke an alle Helfer vom Dorffest', excerpt: 'Ein grosses Dankeschön an alle, die am Dorffest mitgeholfen haben.', team: null, publishedAt: dateOffset(-11, 9, 0), views: 301, author: 'Präsidium', cover: 'event' },
    { id: 'n6', title: 'Damen FF1 – neue Torhüterin', excerpt: 'Wir heissen Laura Weber als neue Torhüterin der Damenmannschaft herzlich willkommen.', team: 't8', publishedAt: dateOffset(-14, 11, 20), views: 156, author: 'Corinne Keller', cover: 'news' },
  ];

  readonly activity: ActivityItem[] = (() => {
    const templates = [
      (n: string) => ({ icon: '✕', color: 'var(--warning)', text: `${n} hat sich vom Training (Di 19:30) abgemeldet: verletzt` }),
      (n: string) => ({ icon: '✓', color: 'var(--success)', text: `${n} hat sich für Training (Mi 17:30) angemeldet` }),
      (n: string) => ({ icon: '⚽', color: 'var(--primary)', text: `Team U15 hat 3:1 gegen FC Muster gewonnen` }),
      (n: string) => ({ icon: '💰', color: 'var(--info)', text: `${n} hat den Jahresbeitrag bezahlt: CHF 250.00` }),
      (n: string) => ({ icon: '📰', color: 'var(--text)', text: `Neue News: "Neue Trainingskleider eingetroffen" publiziert` }),
      (n: string) => ({ icon: '👤', color: 'var(--success)', text: `${n} wurde dem Team Junioren U17 zugewiesen` }),
      (n: string) => ({ icon: '📅', color: 'var(--info)', text: `Neues Event erstellt: "Grümpelturnier" (14. Mai)` }),
      (n: string) => ({ icon: '✕', color: 'var(--warning)', text: `${n} hat sich vom Match (Sa 15:00) abgemeldet: Familienfeier` }),
      (n: string) => ({ icon: '✓', color: 'var(--success)', text: `${n} ist neu als Aktivmitglied beigetreten` }),
      (n: string) => ({ icon: '📸', color: 'var(--text)', text: `Matchbericht "1. Mannschaft gewinnt Derby" publiziert` }),
    ];
    const minsAgo = [3,11,24,47,68,92,134,180,220,265,340,420,510,620,745,880,1000,1100,1200,1300];
    return Array.from({ length: 20 }, (_, i) => {
      const m = this.members[Math.floor(rnd() * this.members.length)];
      const name = `${m.firstName} ${m.lastName.charAt(0)}.`;
      const tpl = templates[Math.floor(rnd() * templates.length)];
      return { id: `a${i}`, ...tpl(name), minsAgo: minsAgo[i] || i * 90 };
    });
  })();

  getTeam(id: string | null): Team | undefined {
    return id ? this.teams.find(t => t.id === id) : undefined;
  }

  getRole(id: string): Role | undefined {
    return this.roles.find(r => r.id === id);
  }

  getMembersForTeam(teamId: string): Member[] {
    return this.members.filter(m => m.teams.includes(teamId));
  }

  readonly inviteCodes = signal<InviteCode[]>([
    {
      id: 'inv1',
      code: 'FCS-2026-A4XK',
      roleIds: ['r5'],
      teamId: null,
      maxUses: 20,
      usedCount: 12,
      expiresAt: dateOffset(30, 23, 59),
      note: 'Generelle Mitgliederwerbung 2026',
      createdAt: dateOffset(-20, 10, 0),
      createdBy: 'Markus Gerber',
      status: 'active',
    },
    {
      id: 'inv2',
      code: 'FCS-U15-BJM9',
      roleIds: ['r5'],
      teamId: 't5',
      maxUses: 5,
      usedCount: 3,
      expiresAt: dateOffset(60, 23, 59),
      note: 'Neue U15-Spieler Frühjahr',
      createdAt: dateOffset(-10, 14, 20),
      createdBy: 'Kilian Graf',
      status: 'active',
    },
    {
      id: 'inv3',
      code: 'FCS-COACH-XY72',
      roleIds: ['r4', 'r3'],
      teamId: null,
      maxUses: 3,
      usedCount: 0,
      expiresAt: null,
      note: 'Neue Trainer',
      createdAt: dateOffset(-5, 9, 0),
      createdBy: 'Markus Gerber',
      status: 'active',
    },
    {
      id: 'inv4',
      code: 'FCS-VERSAMM-2F',
      roleIds: ['r6'],
      teamId: null,
      maxUses: null,
      usedCount: 8,
      expiresAt: dateOffset(-2, 20, 0),
      note: 'GV-Teilnehmer',
      createdAt: dateOffset(-60, 11, 0),
      createdBy: 'Aktuar',
      status: 'active',
    },
    {
      id: 'inv5',
      code: 'FCS-ALT-9X3M',
      roleIds: ['r5'],
      teamId: null,
      maxUses: 10,
      usedCount: 10,
      expiresAt: null,
      note: 'Altes Onboarding',
      createdAt: dateOffset(-90, 15, 0),
      createdBy: 'Markus Gerber',
      status: 'revoked',
    },
  ]);

  addInviteCode(c: InviteCode): void {
    this.inviteCodes.update(list => [c, ...list]);
  }

  updateInviteCode(id: string, patch: Partial<InviteCode>): void {
    this.inviteCodes.update(list => list.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  removeInviteCode(id: string): void {
    this.inviteCodes.update(list => list.filter(c => c.id !== id));
  }

  findInviteCode(code: string): InviteCode | undefined {
    return this.inviteCodes().find(c => c.code.toLowerCase() === code.toLowerCase() && c.status === 'active');
  }
}

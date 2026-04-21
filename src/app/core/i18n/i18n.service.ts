import { Injectable, signal, effect, computed } from '@angular/core';
import { de } from './translations/de';
import { fr } from './translations/fr';
import { it } from './translations/it';

export type Locale = 'de' | 'fr' | 'it';

type TranslationMap = { [key: string]: string | string[] | TranslationMap };

const CATALOGS: Record<Locale, TranslationMap> = { de, fr, it };

function loadLS(): Locale {
  try {
    const v = localStorage.getItem('hubby-locale');
    if (v === 'de' || v === 'fr' || v === 'it') return v;
  } catch {}
  return 'de';
}

function getNested(obj: TranslationMap, key: string): string | string[] | undefined {
  const parts = key.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    return v === undefined ? `{${k}}` : String(v);
  });
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>(loadLS());

  readonly catalog = computed(() => CATALOGS[this.locale()]);

  constructor() {
    effect(() => {
      try { localStorage.setItem('hubby-locale', this.locale()); } catch {}
      document.documentElement.setAttribute('lang', this.locale());
    });
  }

  setLocale(l: Locale): void {
    this.locale.set(l);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const val = getNested(this.catalog(), key);
    if (val === undefined) {
      // Fallback to German for missing keys
      const fallback = getNested(CATALOGS.de, key);
      if (fallback === undefined) return key;
      return typeof fallback === 'string' ? interpolate(fallback, params) : key;
    }
    return typeof val === 'string' ? interpolate(val, params) : key;
  }

  tArr(key: string): string[] {
    const val = getNested(this.catalog(), key);
    if (Array.isArray(val)) return val;
    const fallback = getNested(CATALOGS.de, key);
    return Array.isArray(fallback) ? fallback : [];
  }

  // Locale-aware number formatting for CHF
  formatChf(n: number): string {
    const abs = Math.abs(n);
    const parts = abs.toFixed(2).split('.');
    const thousands = this.locale() === 'de' ? "'" : this.locale() === 'fr' ? ' ' : '.';
    const decimal = this.locale() === 'de' ? '.' : this.locale() === 'fr' ? ',' : ',';
    const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    return (n < 0 ? '-' : '') + 'CHF ' + whole + decimal + parts[1];
  }

  // Weekday abbreviations (Sun..Sat)
  weekdays(): string[] {
    return this.tArr('weekday.short');
  }

  // Month full names (Jan..Dec)
  months(): string[] {
    return this.tArr('month.full');
  }
}

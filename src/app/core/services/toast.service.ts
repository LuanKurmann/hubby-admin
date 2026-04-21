import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: number;
  body: string;
  title?: string;
  kind?: 'success' | 'error' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  items = signal<ToastItem[]>([]);

  show(t: string | Omit<ToastItem, 'id'>): void {
    const id = Date.now() + Math.random();
    const item: ToastItem = typeof t === 'string' ? { id, body: t } : { id, ...t };
    this.items.update(prev => [...prev, item]);
    setTimeout(() => this.dismiss(item.id), 4000);
  }

  dismiss(id: number): void {
    this.items.update(prev => prev.filter(x => x.id !== id));
  }
}

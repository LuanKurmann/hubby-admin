import { Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../../core/services/app-state.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../modal/modal.component';

interface Form {
  type: 'training' | 'match' | 'event';
  title: string;
  team: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  repeat: string;
  reminder: string;
  description: string;
}

@Component({
  selector: 'app-add-event-modal',
  standalone: true,
  imports: [ModalComponent, FormsModule],
  template: `
    <app-modal [open]="state.addEventOpen()" title="Neues Event erstellen" [width]="640" (closed)="close()">
      <div style="display:flex;flex-direction:column;gap:14px">
        <!-- Type selector -->
        <div>
          <label class="label">Typ</label>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
            @for (t of types; track t.k) {
              <button (click)="update('type', t.k)"
                [style.border]="'1px solid ' + (form().type === t.k ? t.c : 'var(--border)')"
                [style.background]="form().type === t.k ? t.bg : 'var(--bg-elev)'"
                [style.color]="form().type === t.k ? t.c : 'var(--text)'"
                style="padding:10px;border-radius:8px;font-size:13px;font-weight:500">{{ t.l }}</button>
            }
          </div>
        </div>
        <div>
          <label class="label">Titel</label>
          <input class="input" [(ngModel)]="form().title" (ngModelChange)="update('title', $event)" placeholder="z.B. Training U15">
        </div>
        <div>
          <label class="label">Team</label>
          <select class="select" [(ngModel)]="form().team" (ngModelChange)="update('team', $event)">
            <option value="">Alle / Vereinsweit</option>
            @for (t of data.teams; track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div>
            <label class="label">Datum</label>
            <input class="input" type="date" [(ngModel)]="form().date" (ngModelChange)="update('date', $event)">
          </div>
          <div>
            <label class="label">Start</label>
            <input class="input" type="time" [(ngModel)]="form().startTime" (ngModelChange)="update('startTime', $event)">
          </div>
          <div>
            <label class="label">Ende</label>
            <input class="input" type="time" [(ngModel)]="form().endTime" (ngModelChange)="update('endTime', $event)">
          </div>
        </div>
        <div>
          <label class="label">Ort</label>
          <input class="input" [(ngModel)]="form().location" (ngModelChange)="update('location', $event)" placeholder="z.B. Sportplatz Rüttigasse, Seedorf">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label class="label">Wiederholung</label>
            <select class="select" [(ngModel)]="form().repeat" (ngModelChange)="update('repeat', $event)">
              <option value="once">Einmalig</option>
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
          </div>
          <div>
            <label class="label">Push-Reminder</label>
            <select class="select" [(ngModel)]="form().reminder" (ngModelChange)="update('reminder', $event)">
              <option value="0">Ohne</option>
              <option value="1">1 Std vorher</option>
              <option value="3">3 Std vorher</option>
              <option value="24">1 Tag vorher</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Beschreibung</label>
          <textarea class="textarea" [(ngModel)]="form().description" (ngModelChange)="update('description', $event)" rows="3"></textarea>
        </div>
      </div>
      <ng-container ngProjectAs="[slot=footer]">
        <button class="btn" (click)="close()">Abbrechen</button>
        <button class="btn btn-primary" (click)="submit()">Event erstellen</button>
      </ng-container>
    </app-modal>
  `,
})
export class AddEventModalComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  types = [
    { k: 'training' as const, l: 'Training', c: 'var(--event-training)', bg: 'var(--event-training-bg)' },
    { k: 'match' as const, l: 'Match', c: 'var(--event-match)', bg: 'var(--event-match-bg)' },
    { k: 'event' as const, l: 'Event', c: 'var(--event-event)', bg: 'var(--event-event-bg)' },
  ];

  form = signal<Form>(this.defaultForm());

  constructor() {
    effect(() => {
      if (this.state.addEventOpen()) {
        const init = this.state.addEventInitial();
        if (init) {
          const d = init.date;
          const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const hour = init.hour ?? 19;
          const startT = `${String(hour).padStart(2,'0')}:00`;
          const endT = `${String(hour + 1).padStart(2,'0')}:30`;
          this.form.update(f => ({ ...f, date: iso, startTime: startT, endTime: endT }));
        }
      }
    });
  }

  defaultForm(): Form {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { type: 'training', title: '', team: '', date: iso, startTime: '19:30', endTime: '21:00', location: '', repeat: 'once', reminder: '3', description: '' };
  }

  update<K extends keyof Form>(k: K, v: Form[K]): void {
    this.form.update(f => ({ ...f, [k]: v }));
  }

  close(): void {
    this.state.addEventOpen.set(false);
    this.form.set(this.defaultForm());
  }

  submit(): void {
    const f = this.form();
    if (!f.title || !f.date) {
      this.toast.show({ kind: 'error', body: 'Bitte Titel und Datum angeben.' });
      return;
    }
    this.toast.show({ kind: 'success', title: 'Event erstellt', body: `${f.title} wurde eingeplant.` });
    this.close();
  }
}

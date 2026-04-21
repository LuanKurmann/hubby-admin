import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../../core/services/app-state.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../modal/modal.component';

interface Form {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  team: string;
  roleId: string;
}

@Component({
  selector: 'app-add-member-modal',
  standalone: true,
  imports: [ModalComponent, FormsModule],
  template: `
    <app-modal [open]="state.addMemberOpen()" title="Mitglied einladen" [width]="520" (closed)="close()">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label class="label">Vorname</label>
            <input class="input" [(ngModel)]="form().firstName" (ngModelChange)="update('firstName', $event)" autofocus>
          </div>
          <div>
            <label class="label">Nachname</label>
            <input class="input" [(ngModel)]="form().lastName" (ngModelChange)="update('lastName', $event)">
          </div>
        </div>
        <div>
          <label class="label">E-Mail (für Einladung)</label>
          <input class="input" type="email" [(ngModel)]="form().email" (ngModelChange)="update('email', $event)">
        </div>
        <div>
          <label class="label">Telefon (optional)</label>
          <input class="input" [(ngModel)]="form().phone" (ngModelChange)="update('phone', $event)">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label class="label">Team</label>
            <select class="select" [(ngModel)]="form().team" (ngModelChange)="update('team', $event)">
              <option value="">Ohne Team</option>
              @for (t of data.teams; track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label">Rolle</label>
            <select class="select" [(ngModel)]="form().roleId" (ngModelChange)="update('roleId', $event)">
              @for (r of data.roles; track r.id) {
                <option [value]="r.id">{{ r.name }}</option>
              }
            </select>
          </div>
        </div>
        <div style="padding:12px;background:var(--bg-subtle);border-radius:8px;font-size:12px;color:var(--text-muted);line-height:1.5">
          Nach dem Einladen erhält das Mitglied eine E-Mail mit einem persönlichen Link zur Aktivierung des Kontos und Einrichtung der App.
        </div>
      </div>
      <ng-container ngProjectAs="[slot=footer]">
        <button class="btn" (click)="close()">Abbrechen</button>
        <button class="btn btn-primary" (click)="submit()">Einladung senden</button>
      </ng-container>
    </app-modal>
  `,
})
export class AddMemberModalComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  form = signal<Form>({ firstName: '', lastName: '', email: '', phone: '', team: '', roleId: 'r5' });

  update<K extends keyof Form>(k: K, v: Form[K]): void {
    this.form.update(f => ({ ...f, [k]: v }));
  }

  close(): void {
    this.state.addMemberOpen.set(false);
    this.form.set({ firstName: '', lastName: '', email: '', phone: '', team: '', roleId: 'r5' });
  }

  submit(): void {
    const f = this.form();
    if (!f.firstName || !f.lastName || !f.email) {
      this.toast.show({ kind: 'error', body: 'Bitte alle Pflichtfelder ausfüllen.' });
      return;
    }
    this.toast.show({ kind: 'success', title: 'Einladung versendet', body: `${f.firstName} ${f.lastName} erhält eine E-Mail.` });
    this.close();
  }
}

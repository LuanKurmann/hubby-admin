import { Component, inject } from '@angular/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { ModalComponent } from '../modal/modal.component';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Globale Suche öffnen' },
  { keys: ['/'], label: 'Suche fokussieren' },
  { keys: ['N'], label: 'Neues Element (kontextabhängig)' },
  { keys: ['?'], label: 'Diese Übersicht öffnen' },
  { keys: ['G', 'D'], label: 'Zum Dashboard' },
  { keys: ['G', 'M'], label: 'Zu Mitgliedern' },
  { keys: ['G', 'E'], label: 'Zu Events' },
  { keys: ['Esc'], label: 'Schliessen / Abbrechen' },
];

@Component({
  selector: 'app-shortcuts-overlay',
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal [open]="state.shortcutsOpen()" title="Tastatur-Shortcuts" [width]="480" (closed)="state.shortcutsOpen.set(false)">
      <div style="display:flex;flex-direction:column;gap:2px">
        @for (s of shortcuts; track $index; let last = $last) {
          <div [style.border-bottom]="last ? 'none' : '1px solid var(--border)'"
            style="display:flex;align-items:center;justify-content:space-between;padding:8px 4px">
            <div style="font-size:13px;color:var(--text-secondary)">{{ s.label }}</div>
            <div style="display:flex;gap:4px">
              @for (k of s.keys; track k) { <span class="kbd">{{ k }}</span> }
            </div>
          </div>
        }
      </div>
    </app-modal>
  `,
})
export class ShortcutsOverlayComponent {
  state = inject(AppStateService);
  shortcuts = SHORTCUTS;
}

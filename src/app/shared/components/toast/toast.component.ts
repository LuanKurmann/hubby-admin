import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div style="position:fixed;bottom:16px;right:16px;z-index:80;display:flex;flex-direction:column;gap:8px;max-width:360px;pointer-events:none">
      @for (t of toast.items(); track t.id) {
        <div class="slide-in" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-elev);border:1px solid var(--border);border-radius:var(--r-md);box-shadow:var(--shadow-lg);min-width:260px;pointer-events:all">
          <div [style.color]="iconColor(t.kind)" style="margin-top:1px;flex-shrink:0">
            <app-icon [name]="iconName(t.kind)" [size]="16" />
          </div>
          <div style="flex:1;font-size:13px">
            @if (t.title) { <div style="font-weight:600;margin-bottom:2px">{{ t.title }}</div> }
            <div style="color:var(--text-secondary)">{{ t.body }}</div>
          </div>
          <button (click)="toast.dismiss(t.id)" class="btn btn-ghost btn-icon" style="height:22px;width:22px;flex-shrink:0">
            <app-icon name="x" [size]="12" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toast = inject(ToastService);

  iconName(kind?: string): string {
    return kind === 'error' ? 'xCircle' : kind === 'warning' ? 'alert' : 'checkCircle';
  }

  iconColor(kind?: string): string {
    return kind === 'error' ? 'var(--danger)' : kind === 'warning' ? 'var(--warning)' : 'var(--success)';
  }
}

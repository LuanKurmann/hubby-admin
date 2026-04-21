import { Component, input, output, HostListener } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (open()) {
      <div style="position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:20px">
        <div (click)="closed.emit()" style="position:absolute;inset:0;background:rgba(12,10,9,0.5);animation:fadeIn .15s"></div>
        <div [style.width.px]="width()"
          style="position:relative;max-width:100%;max-height:90vh;background:var(--bg-elev);border-radius:var(--r-lg);box-shadow:var(--shadow-xl);display:flex;flex-direction:column;animation:slideInUp .22s cubic-bezier(.2,.9,.3,1)">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
            <div style="font-size:15px;font-weight:600">{{ title() }}</div>
            <button (click)="closed.emit()" class="btn btn-ghost btn-icon"><app-icon name="x" [size]="16" /></button>
          </div>
          <div style="padding:20px;overflow-y:auto;flex:1">
            <ng-content />
          </div>
          <div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
            <ng-content select="[slot=footer]" />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  open = input<boolean>(false);
  title = input<string>('');
  width = input<number>(560);
  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open()) this.closed.emit();
  }
}

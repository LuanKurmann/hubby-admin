import { Component, input, output, HostListener } from '@angular/core';

@Component({
  selector: 'app-drawer',
  standalone: true,
  template: `
    @if (open()) {
      <div style="position:fixed;inset:0;z-index:50;display:flex;justify-content:flex-end">
        <div (click)="closed.emit()" style="position:absolute;inset:0;background:rgba(12,10,9,0.35);animation:fadeIn .15s"></div>
        <div [style.width.px]="width()" style="position:relative;max-width:95vw;height:100%;background:var(--bg-elev);box-shadow:var(--shadow-xl);display:flex;flex-direction:column;animation:slideInRight .22s cubic-bezier(.2,.9,.3,1)">
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class DrawerComponent {
  open = input<boolean>(false);
  width = input<number>(520);
  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open()) this.closed.emit();
  }
}

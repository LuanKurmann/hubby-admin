import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal [open]="open()" [title]="title()" [width]="440" (closed)="closed.emit()">
      <div style="font-size:13px;color:var(--text-secondary)">{{ body() }}</div>
      <ng-container ngProjectAs="[slot=footer]">
        <button class="btn" (click)="closed.emit()">Abbrechen</button>
        <button [class]="danger() ? 'btn btn-danger' : 'btn btn-primary'" (click)="onConfirm()">{{ confirmLabel() }}</button>
      </ng-container>
    </app-modal>
  `,
})
export class ConfirmDialogComponent {
  open = input<boolean>(false);
  title = input<string>('');
  body = input<string>('');
  confirmLabel = input<string>('Bestätigen');
  danger = input<boolean>(false);
  closed = output<void>();
  confirmed = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
    this.closed.emit();
  }
}

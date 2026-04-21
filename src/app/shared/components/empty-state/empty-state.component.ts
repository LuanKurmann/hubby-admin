import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div style="padding:48px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px">
      <div style="font-size:64px;line-height:1">{{ emoji() }}</div>
      <div style="font-size:15px;font-weight:600">{{ title() }}</div>
      @if (body()) {
        <div style="font-size:13px;color:var(--text-muted);max-width:380px">{{ body() }}</div>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  emoji = input<string>('📭');
  title = input<string>('');
  body = input<string>('');
}

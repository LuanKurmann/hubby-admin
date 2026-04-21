import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
      <div class="skeleton" style="height:28px;width:200px;border-radius:6px"></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        @for (i of [1,2,3,4]; track i) {
          <div class="skeleton" style="height:92px;border-radius:12px"></div>
        }
      </div>
      <div class="skeleton" style="height:320px;border-radius:12px"></div>
    </div>
  `,
})
export class SkeletonComponent {}

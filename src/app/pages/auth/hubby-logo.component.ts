import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-hubby-logo',
  standalone: true,
  template: `
    <div
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.borderRadius.px]="10"
      [style.background]="bg()"
      [style.color]="color()"
      [style.display]="'flex'"
      [style.alignItems]="'center'"
      [style.justifyContent]="'center'"
      [style.fontWeight]="800"
      [style.fontSize.px]="fontSize()"
      [style.letterSpacing]="'-0.04em'"
    >h</div>
  `,
})
export class HubbyLogoComponent {
  size = input<number>(36);
  inverted = input<boolean>(false);

  bg = computed(() => this.inverted() ? '#fff' : 'var(--primary)');
  color = computed(() => this.inverted() ? 'var(--primary)' : '#fff');
  fontSize = computed(() => this.size() * 0.5);
}

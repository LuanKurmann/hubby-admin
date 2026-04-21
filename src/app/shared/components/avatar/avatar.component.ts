import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `<span [class]="cls()" [style.background]="bg()" [style.color]="fgC()">{{ initials() }}</span>`,
})
export class AvatarComponent {
  name = input<string>('');
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  color = input<string | undefined>(undefined);

  initials = computed(() =>
    (this.name() || '??').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  );

  private hash = computed(() =>
    [...(this.name() || '')].reduce((a, c) => a + c.charCodeAt(0), 0)
  );

  private palette = ['#E0F2FE','#FEE2E2','#FEF3C7','#D1FAE5','#EDE9FE','#FCE7F3','#CCFBF1','#FFEDD5'];
  private fg = ['#075985','#991B1B','#92400E','#065F46','#5B21B6','#9D174D','#115E59','#9A3412'];

  bg = computed(() => this.color() || this.palette[this.hash() % this.palette.length]);
  fgC = computed(() => this.color() ? '#fff' : this.fg[this.hash() % this.fg.length]);

  cls = computed(() => {
    const s = this.size();
    return ['avatar', s === 'sm' ? 'avatar-sm' : s === 'lg' ? 'avatar-lg' : s === 'xl' ? 'avatar-xl' : ''].filter(Boolean).join(' ');
  });
}

import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Pipe({ name: 'formatDate', standalone: true, pure: false })
export class FormatDatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(d: Date | null | undefined, mode: 'date' | 'time' | 'datetime' | 'weekday' = 'date'): string {
    if (!d) return '';
    this.i18n.locale();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    if (mode === 'time') return `${hh}:${min}`;
    if (mode === 'weekday') return this.i18n.weekdays()[d.getDay()] ?? '';
    if (mode === 'datetime') return `${dd}.${mm}.${yy} · ${hh}:${min}`;
    return `${dd}.${mm}.${yy}`;
  }
}

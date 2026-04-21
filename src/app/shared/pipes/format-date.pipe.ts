import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatDate', standalone: true })
export class FormatDatePipe implements PipeTransform {
  transform(d: Date | null | undefined, mode: 'date' | 'time' | 'datetime' | 'weekday' = 'date'): string {
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
    if (mode === 'time') return `${hh}:${min}`;
    if (mode === 'weekday') return days[d.getDay()];
    if (mode === 'datetime') return `${dd}.${mm}.${yy} · ${hh}:${min}`;
    return `${dd}.${mm}.${yy}`;
  }
}

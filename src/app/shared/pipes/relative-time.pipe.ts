import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(mins: number): string {
    if (mins < 1) return 'jetzt';
    if (mins < 60) return `vor ${mins} Min`;
    if (mins < 1440) return `vor ${Math.floor(mins / 60)} Std`;
    return `vor ${Math.floor(mins / 1440)} Tagen`;
  }
}

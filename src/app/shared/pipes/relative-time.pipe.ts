import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Pipe({ name: 'relativeTime', standalone: true, pure: false })
export class RelativeTimePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(mins: number): string {
    this.i18n.locale();
    if (mins < 1) return this.i18n.t('time.now');
    if (mins < 60) return this.i18n.t('time.agoMin', { n: mins });
    if (mins < 1440) return this.i18n.t('time.agoHrs', { n: Math.floor(mins / 60) });
    return this.i18n.t('time.agoDays', { n: Math.floor(mins / 1440) });
  }
}

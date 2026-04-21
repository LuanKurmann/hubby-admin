import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    // touch locale signal so pipe re-runs on change
    this.i18n.locale();
    return this.i18n.t(key, params);
  }
}

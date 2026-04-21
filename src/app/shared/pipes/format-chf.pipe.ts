import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Pipe({ name: 'formatChf', standalone: true, pure: false })
export class FormatChfPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(n: number): string {
    this.i18n.locale();
    return this.i18n.formatChf(n);
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatChf', standalone: true })
export class FormatChfPipe implements PipeTransform {
  transform(n: number): string {
    return 'CHF ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  }
}

import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18nService = inject(I18nService);

  transform(key: string): string {
    return this.i18nService.t()(key);
  }
}

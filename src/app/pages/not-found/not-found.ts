import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-not-found',
  imports: [TranslatePipe],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {
  private readonly i18nService = inject(I18nService);
}

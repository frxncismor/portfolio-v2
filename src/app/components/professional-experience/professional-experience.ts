import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@pipes/translate.pipe';
import { I18nService } from '@services/i18n.service';
import { WorkExperienceItem } from '@interfaces/workExperienceItem';
import { NgClass } from '@angular/common';


@Component({
  selector: 'app-professional-experience',
  imports: [TranslatePipe, NgClass],
  templateUrl: './professional-experience.html',
  styleUrl: './professional-experience.css',
})
export class ProfessionalExperience {
  private readonly i18nService = inject(I18nService);
  readonly translate = this.i18nService.t;

  readonly items = computed(() => {
    const itemsData = this.i18nService.getTranslationValue('workExperience.items');
    return Array.isArray(itemsData) ? itemsData as WorkExperienceItem[] : [];
  });
}

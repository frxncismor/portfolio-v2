import { Component, computed, inject, AfterViewInit, OnDestroy } from '@angular/core';
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
export class ProfessionalExperience implements AfterViewInit, OnDestroy {
  private readonly i18nService = inject(I18nService);
  readonly translate = this.i18nService.t;
  private observer?: IntersectionObserver;

  readonly items = computed(() => {
    const itemsData = this.i18nService.getTranslationValue('workExperience.items');
    return Array.isArray(itemsData) ? (itemsData as WorkExperienceItem[]) : [];
  });

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    const options: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    setTimeout(() => {
      const section = document.querySelector('.experience-section');
      const items = document.querySelectorAll('.experience-item');
      if (section) this.observer?.observe(section);
      items.forEach((el) => this.observer?.observe(el));
    }, 100);
  }
}

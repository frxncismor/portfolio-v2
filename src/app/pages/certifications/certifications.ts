import { Component, computed, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Certification } from '@interfaces/certification';
import { I18nService } from '@services/i18n.service';
import { TranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-certifications',
  imports: [CommonModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './certifications.html',
  styleUrl: './certifications.css',
})
export class Certifications implements AfterViewInit, OnDestroy {
  private readonly i18nService = inject(I18nService);
  readonly translate = this.i18nService.t;
  private observer?: IntersectionObserver;

  readonly certifications = computed(() => {
    const certsData = this.i18nService.getTranslationValue('certifications.items');
    return Array.isArray(certsData) ? (certsData as Certification[]) : [];
  });

  readonly defaultCertificateImage = '/assets/certificate-icon.svg';

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
      threshold: 0.01,
      rootMargin: '0px',
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
      const header = document.querySelector('.certifications-header');
      const elementsToObserve = ['.certification-item'];

      if (header) {
        const rect = header.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isVisible) {
          header.classList.add('animate-in');
        } else {
          this.observer?.observe(header);
        }
      }

      elementsToObserve.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

          if (isVisible) {
            el.classList.add('animate-in');
          } else {
            this.observer?.observe(el);
          }
        });
      });
    }, 100);
  }
}

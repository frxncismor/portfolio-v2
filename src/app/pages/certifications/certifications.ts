import { Component, computed, inject, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Certification } from '@interfaces/certification';
import { I18nService } from '@services/i18n.service';
import { TranslatePipe } from '@pipes/translate.pipe';
import { SEOService } from '@services/seo.service';

@Component({
  selector: 'app-certifications',
  imports: [CommonModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './certifications.html',
  styleUrl: './certifications.css',
})
export class Certifications implements OnInit, AfterViewInit, OnDestroy {
  private readonly i18nService = inject(I18nService);
  private readonly seoService = inject(SEOService);
  readonly translate = this.i18nService.t;
  private observer?: IntersectionObserver;

  readonly certifications = computed(() => {
    const certsData = this.i18nService.getTranslationValue('certifications.items');
    return Array.isArray(certsData) ? (certsData as Certification[]) : [];
  });

  readonly defaultCertificateImage = '/assets/certificate-icon.svg';

  ngOnInit(): void {
    const locale = this.i18nService.getLocale();
    
    this.seoService.updateSEO({
      title: locale === 'es'
        ? 'Certificaciones - Francisco Moreno | Portfolio'
        : 'Certifications - Francisco Moreno | Portfolio',
      description: locale === 'es'
        ? 'Certificaciones profesionales de Francisco Moreno en tecnologías web, desarrollo frontend, backend y herramientas de desarrollo.'
        : 'Professional certifications of Francisco Moreno in web technologies, frontend development, backend and development tools.',
      keywords: 'Francisco Moreno, Certifications, LinkedIn Certifications, Web Development Certifications, Angular, React, TypeScript, Professional Certifications, developer en monterrey, developer en woodlands, developer in woodlands, developer near woodlands, desarrollador cerca de monterrey, desarrollador en monterrey',
      url: '/certifications',
      type: 'website',
    });
  }

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

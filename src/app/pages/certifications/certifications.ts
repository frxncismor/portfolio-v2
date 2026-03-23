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
    const isEnglish = locale !== 'es';

    this.seoService.updateCanonical('/certifications');

    this.seoService.updateSEO({
      title: isEnglish
        ? 'Certifications - Francisco Moreno | Portfolio'
        : 'Certificaciones - Francisco Moreno | Portfolio',
      description: isEnglish
        ? 'Professional certifications of Francisco Moreno in web technologies, frontend development, backend and development tools.'
        : 'Certificaciones profesionales de Francisco Moreno en tecnologías web, desarrollo frontend, backend y herramientas de desarrollo.',
      keywords:
        'Francisco Moreno, Certifications, Web Development Certifications, Angular, React, TypeScript, Professional Certifications',
      url: '/certifications',
      type: 'website',
    });

    const certs = this.certifications();
    const credentialSchemas = certs.map((cert) => ({
      '@type': 'EducationalOccupationalCredential',
      name: cert.name,
      credentialCategory: 'Professional Certificate',
      recognizedBy: {
        '@type': 'Organization',
        name: cert.issuer,
      },
      dateCreated: cert.issued_raw,
      url: cert.certificateUrl,
      competencyRequired: cert.skills.join(', '),
      holder: {
        '@type': 'Person',
        '@id': 'https://frxncismor.dev/#person',
        name: 'Francisco Moreno',
      },
    }));

    this.seoService.addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: isEnglish
        ? 'Professional Certifications - Francisco Moreno'
        : 'Certificaciones Profesionales - Francisco Moreno',
      description: isEnglish
        ? 'Professional certifications in web technologies, frontend development, and software engineering.'
        : 'Certificaciones profesionales en tecnologias web, desarrollo frontend e ingenieria de software.',
      url: 'https://frxncismor.dev/certifications',
      author: {
        '@type': 'Person',
        '@id': 'https://frxncismor.dev/#person',
        name: 'Francisco Moreno',
      },
      itemListElement: credentialSchemas.map((cred, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: cred,
      })),
    }, 'credentials');
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

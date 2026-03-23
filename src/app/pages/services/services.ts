import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '@services/i18n.service';
import { SEOService } from '@services/seo.service';
import { TranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-services',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './services.html',
  styleUrl: './services.css',
})
export class Services implements OnInit {
  private readonly i18nService = inject(I18nService);
  private readonly seoService = inject(SEOService);
  readonly translate = this.i18nService.t;

  ngOnInit(): void {
    const locale = this.i18nService.getLocale();
    const t = this.translate();

    this.seoService.updateCanonical('/services');

    this.seoService.updateSEO({
      title: t('services.seo.title'),
      description: t('services.seo.description'),
      keywords: t('services.seo.keywords'),
      url: '/services',
      type: 'website',
    });

    this.seoService.addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'Francisco Moreno — Angular & React Development Services',
      description: 'Freelance frontend development services specializing in Angular, React, and TypeScript. Based in The Woodlands, TX. Available for US clients.',
      url: 'https://frxncismor.dev/services',
      areaServed: [
        { '@type': 'Country', name: 'United States' },
        { '@type': 'AdministrativeArea', name: 'Texas' },
      ],
      provider: {
        '@type': 'Person',
        '@id': 'https://frxncismor.dev/#person',
        name: 'Francisco Moreno',
      },
      serviceType: ['Angular Development', 'React Development', 'TypeScript Consulting', 'Frontend Architecture'],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Web Development Services',
      },
    }, 'service');
  }
}

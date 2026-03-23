import { Component, OnInit, inject } from '@angular/core';
import { Hero } from '@components/hero/hero';
import { TechStack } from '@components/tech-stack/tech-stack';
import { ProfessionalExperience } from '@components/professional-experience/professional-experience';
import { Projects } from '@components/projects/projects';
import { AboutMe } from '@components/about-me/about-me';
import { SEOService } from '@services/seo.service';
import { I18nService } from '@services/i18n.service';

@Component({
  selector: 'app-home',
  imports: [Hero, TechStack, ProfessionalExperience, Projects, AboutMe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly seoService = inject(SEOService);
  private readonly i18nService = inject(I18nService);

  ngOnInit(): void {
    const locale = this.i18nService.getLocale();

    this.seoService.updateCanonical('/home');

    this.seoService.updateSEO({
      title: 'Francisco Moreno - Senior Web UI Engineer | Portfolio',
      description:
        locale === 'es'
          ? 'Senior Web UI Engineer con 6+ años de experiencia. Especializado en Angular, React, TypeScript. Disponible para proyectos full-time y freelance. Basado en The Woodlands, TX.'
          : "Senior Web UI Engineer · 6+ yrs building apps for Royal Caribbean & United Airlines · Angular, React, TypeScript · The Woodlands, TX",
      keywords:
        'Francisco Moreno, Senior Frontend Engineer, Angular Developer, React Developer, TypeScript, The Woodlands TX, Web UI Engineer',
      url: '/home',
      type: 'website',
    });

    // Add structured data (Person/Portfolio)
    this.seoService.addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': 'https://frxncismor.dev/#person',
      name: 'Francisco Moreno',
      jobTitle: 'Senior Web UI Engineer',
      description:
        "Senior Fullstack Engineer with 6+ years building scalable web apps for enterprise clients like Royal Caribbean, United Airlines, and Dick's Sporting Goods.",
      image: {
        '@type': 'ImageObject',
        url: 'https://frxncismor.dev/myphoto.webp',
      },
      url: 'https://frxncismor.dev',
      sameAs: ['https://linkedin.com/in/frxncismor', 'https://github.com/frxncismor'],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'The Woodlands',
        addressRegion: 'TX',
        addressCountry: 'US',
      },
      knowsAbout: [
        'Angular',
        'React',
        'TypeScript',
        'JavaScript',
        'Next.js',
        'RxJS',
        'NgRx',
        'Supabase',
        'Node.js',
        'AWS',
        'MongoDB',
        'PostgreSQL',
      ],
    }, 'person');
  }
}

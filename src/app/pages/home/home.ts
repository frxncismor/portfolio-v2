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

    this.seoService.updateSEO({
      title: 'Francisco Moreno - Senior Web UI Engineer | Portfolio',
      description: locale === 'es'
        ? 'Senior Web UI Engineer con 6+ años de experiencia. Especializado en Angular, React, TypeScript. Disponible para proyectos full-time y freelance. Basado en The Woodlands, TX.'
        : 'Senior Web UI Engineer with 6+ years of experience. Specialized in Angular, React, TypeScript. Available for full-time and freelance projects. Based in The Woodlands, TX.',
      keywords: 'Francisco Moreno, Web Developer, Frontend Developer, Angular, React, TypeScript, UI Engineer, Portfolio, Full Stack Developer, JavaScript, Next.js, The Woodlands, Texas, developer en monterrey, developer en woodlands, developer in woodlands, developer near woodlands, desarrollador cerca de monterrey, desarrollador en monterrey, developer monterrey, developer woodlands, desarrollador monterrey, desarrollador woodlands, freelance developer woodlands, freelance developer monterrey, freelance desarrollador monterrey, freelance desarrollador woodlands',
      url: '/home',
      type: 'website',
    });

    // Add structured data (Person/Portfolio)
    this.seoService.addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Francisco Moreno',
      jobTitle: 'Senior Web UI Engineer',
      url: 'https://frxncismor.dev',
      sameAs: [
        'https://linkedin.com/in/frxncismor',
        'https://github.com/frxncismor',
      ],
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
    });
  }
}

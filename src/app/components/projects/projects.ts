import { Component, computed, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { ProjectsItem, Technology } from '@interfaces/projectsItem';
import { TranslatePipe } from '@pipes/translate.pipe';
import { I18nService } from '@services/i18n.service';
import { NgOptimizedImage } from '@angular/common';
import { TagModule } from 'primeng/tag';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | null
  | undefined;

@Component({
  selector: 'app-projects',
  imports: [TranslatePipe, NgOptimizedImage, TagModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements AfterViewInit, OnDestroy {
  private readonly i18nService = inject(I18nService);
  readonly translate = this.i18nService.t;
  private observer?: IntersectionObserver;

  readonly projects = computed(() => {
    const projectsData = this.i18nService.getTranslationValue('projects.items');
    return Array.isArray(projectsData) ? (projectsData as ProjectsItem[]) : [];
  });

  readonly technologies = computed(() => {
    const technologiesData = this.i18nService.getTranslationValue('projects.technologies');
    return Array.isArray(technologiesData) ? (technologiesData as Technology[]) : [];
  });

  getTagSeverity(color: string): TagSeverity {
    const validSeverities: TagSeverity[] = [
      'success',
      'secondary',
      'info',
      'warn',
      'danger',
      'contrast',
    ];
    return validSeverities.includes(color as TagSeverity) ? (color as TagSeverity) : 'secondary';
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
      const section = document.querySelector('.projects-section');
      const items = document.querySelectorAll('.project-item');
      if (section) this.observer?.observe(section);
      items.forEach((el) => this.observer?.observe(el));
    }, 100);
  }
}

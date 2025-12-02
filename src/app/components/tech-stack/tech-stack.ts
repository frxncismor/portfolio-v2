import { Component, computed, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslatePipe } from '@pipes/translate.pipe';
import { I18nService } from '@services/i18n.service';
import { CommonModule, NgOptimizedImage } from '@angular/common';

export interface Technology {
  name: string;
  icon: string;
}

export interface TechCategory {
  label: string;
  technologies: Technology[];
}

@Component({
  selector: 'app-tech-stack',
  imports: [TranslatePipe, CommonModule, NgOptimizedImage],
  templateUrl: './tech-stack.html',
  styleUrl: './tech-stack.css',
})
export class TechStack implements AfterViewInit, OnDestroy {
  private readonly i18nService = inject(I18nService);
  readonly translate = this.i18nService.t;
  private observer?: IntersectionObserver;

  readonly categories = computed(() => {
    const categoriesData = this.i18nService.getTranslationValue('home.techStack.categories');
    return (categoriesData as Record<string, TechCategory>) || {};
  });

  readonly categoryKeys = computed(() => {
    return Object.keys(this.categories());
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
      const elements = document.querySelectorAll('.tech-category, .tech-item');
      elements.forEach((el) => this.observer?.observe(el));
    }, 100);
  }

  scrollToCategory(categoryId: string): void {
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

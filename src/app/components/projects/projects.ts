import { Component, computed, inject } from '@angular/core';
import { ProjectsItem, Technology } from '@interfaces/projectsItem';
import { TranslatePipe } from '@pipes/translate.pipe';
import { I18nService } from '@services/i18n.service';
import { NgOptimizedImage } from '@angular/common';
import { TagModule } from 'primeng/tag';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null | undefined;

@Component({
  selector: 'app-projects',
  imports: [TranslatePipe, NgOptimizedImage, TagModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {
  private readonly i18nService = inject(I18nService);
  readonly translate = this.i18nService.t;

  readonly projects = computed(() => {
    const projectsData = this.i18nService.getTranslationValue('projects.items');
    return Array.isArray(projectsData) ? projectsData as ProjectsItem[] : [];
  });

  readonly technologies = computed(() => {
    const technologiesData = this.i18nService.getTranslationValue('projects.technologies');
    return Array.isArray(technologiesData) ? technologiesData as Technology[] : [];
  });

  getTagSeverity(color: string): TagSeverity {
    const validSeverities: TagSeverity[] = ['success', 'secondary', 'info', 'warn', 'danger', 'contrast'];
    return validSeverities.includes(color as TagSeverity) ? (color as TagSeverity) : 'secondary';
  }
}

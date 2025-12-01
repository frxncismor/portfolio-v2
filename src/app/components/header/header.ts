import { Component, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenubarModule } from 'primeng/menubar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { I18nService } from '@services/i18n.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [MenubarModule, SelectButtonModule, CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly i18nService = inject(I18nService);

  readonly translate = this.i18nService.t;

  readonly items = computed(() => [
    { label: this.translate()('header.nav.home'), icon: 'pi pi-home', routerLink: '/' },
    {
      label: this.translate()('header.nav.workExperience'),
      icon: 'pi pi-briefcase',
      url: '/home#work-experience',
    },
    { label: this.translate()('header.nav.about'), icon: 'pi pi-user', url: '/home#about-me' },
    {
      label: this.translate()('header.nav.services'),
      icon: 'pi pi-briefcase',
      routerLink: '/services',
    },
    {
      label: this.translate()('header.nav.projects'),
      icon: 'pi pi-folder',
      url: '/home#projects',
    },
    {
      label: this.translate()('header.nav.priceQuoteGenerator'),
      icon: 'pi pi-calculator',
      routerLink: '/price-quote-generator',
    },
  ]);
}

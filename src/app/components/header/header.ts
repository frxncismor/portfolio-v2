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
  readonly currentLocale = this.i18nService.locale;

  readonly items = computed(() => [
    { label: this.translate()('header.nav.home'), icon: 'pi pi-home', routerLink: '/' },
    {
      label: this.translate()('header.nav.certifications'),
      icon: 'pi pi-briefcase',
      routerLink: '/certifications',
    },
    {
      label: this.translate()('header.nav.priceQuoteGenerator'),
      icon: 'pi pi-calculator',
      routerLink: '/price-quote-generator',
    },
    {
      label: this.translate()('header.nav.blog'),
      icon: 'pi pi-book',
      routerLink: '/blog',
    },
  ]);

  toggleLanguage() {
    const newLocale = this.currentLocale() === 'en' ? 'es' : 'en';
    this.i18nService.setLocale(newLocale);
  }
}

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services').then((m) => m.Services),
  },
  {
    path: 'price-quote-generator',
    loadComponent: () =>
      import('./pages/price-quote-generation/price-quote-generation').then(
        (m) => m.PriceQuoteGeneration,
      ),
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
  { path: '**', redirectTo: 'not-found' },
];

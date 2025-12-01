# Guía de Uso de i18n

Este proyecto incluye soporte completo para internacionalización (i18n) con español e inglés.

## Estructura

- **Servicio**: `src/app/services/i18n.service.ts`
- **Pipe**: `src/app/pipes/translate.pipe.ts`
- **Traducciones**: `src/assets/i18n/es.json` y `src/assets/i18n/en.json`

## Uso en Componentes TypeScript

```typescript
import { Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-example',
  // ...
})
export class ExampleComponent {
  private readonly i18nService = inject(I18nService);

  readonly t = this.i18nService.t;

  // Usar traducciones
  getTitle(): string {
    return this.t()('common.welcome');
  }

  // Cambiar idioma
  changeLanguage(locale: 'es' | 'en'): void {
    this.i18nService.setLocale(locale);
  }
}
```

## Uso en Templates HTML

```html
<!-- Usando el pipe -->
<h1>{{ 'common.welcome' | translate }}</h1>

<!-- Usando signals en TypeScript -->
<p>{{ t()('home.subtitle') }}</p>
```

## Agregar Nuevas Traducciones

1. Edita los archivos JSON en `src/assets/i18n/`:

```json
// es.json
{
  "miSeccion": {
    "titulo": "Mi Título",
    "descripcion": "Mi descripción"
  }
}

// en.json
{
  "miSeccion": {
    "titulo": "My Title",
    "descripcion": "My description"
  }
}
```

2. Usa las traducciones en tu código:

```typescript
this.t()('miSeccion.titulo'); // "Mi Título" o "My Title"
```

## Idiomas Soportados

- **es**: Español (por defecto)
- **en**: Inglés

## Detección Automática del Idioma del Dispositivo

El sistema detecta automáticamente el idioma del dispositivo del usuario siguiendo esta prioridad:

1. **localStorage**: Si el usuario ha seleccionado un idioma previamente, se usa ese
2. **navigator.language**: Idioma principal configurado en el navegador
3. **navigator.languages**: Lista de idiomas preferidos del usuario (se prueba cada uno hasta encontrar uno soportado)
4. **Fallback**: Español (es) si no se detecta ningún idioma soportado

### Ejemplos de Detección

- `navigator.language = "es-ES"` → Detecta **español**
- `navigator.language = "en-US"` → Detecta **inglés**
- `navigator.language = "fr-FR"` → Fallback a **español** (francés no soportado)
- `navigator.languages = ["en", "es", "fr"]` → Detecta **inglés** (primer idioma soportado)

El idioma detectado se establece automáticamente al inicializar la aplicación y se guarda en localStorage para futuras visitas.

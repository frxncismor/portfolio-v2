# Francisco Morales — Portfolio v2

Personal portfolio built with Angular 20, showcasing projects, work experience, blog posts, and a downloadable resume. Fully bilingual (English / Spanish) with dark mode support.

**Live:** [frxncismor.dev](https://frxncismor.dev)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 20 (standalone components, signals) |
| Styling | TailwindCSS 4 + PrimeNG 20 |
| i18n | Custom translation service (EN / ES) |
| Blog | Markdown rendering via Marked + highlight.js |
| PDF | Resume generation via jsPDF |
| SEO | Custom service with structured data / Open Graph |
| Build | Angular CLI 20 |

---

## Features

- **Bilingual** — full English / Spanish toggle via custom i18n service
- **Dark / Light mode** — system-aware with manual toggle
- **Project showcase** — filterable project grid with live previews
- **Work experience timeline** — detailed professional history
- **Blog** — markdown-based posts with syntax highlighting
- **Resume download** — client-side PDF generation
- **Certifications page** — dedicated section for credentials
- **SEO optimized** — meta tags, Open Graph, and structured data

---

## Getting Started

### Prerequisites

- Node.js 20+
- Angular CLI 20

```bash
npm install -g @angular/cli
```

### Install & run

```bash
git clone https://github.com/frxncismor/portfolio-v2.git
cd portfolio-v2
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200).

### Build for production

```bash
ng build
```

Output is in `dist/`. Optimized for performance and tree-shaking.

---

## Project Structure

```
src/
├── app/
│   ├── components/      # Hero, About, Projects, Experience, Tech Stack
│   ├── pages/           # Home, Blog, Certifications, Services, 404
│   ├── services/        # i18n, SEO, Theme, Blog, PDF
│   ├── pipes/           # translate pipe
│   └── interfaces/      # TypeScript interfaces
└── assets/
    ├── i18n/            # en.json / es.json translation files
    └── posts/           # Markdown blog posts
```

---

## Author

**Francisco Morales** — Senior Fullstack Engineer
Angular · React · Node.js · AI-assisted development

[frxncismor.dev](https://frxncismor.dev) · [GitHub](https://github.com/frxncismor) · [LinkedIn](https://linkedin.com/in/frxncismor)

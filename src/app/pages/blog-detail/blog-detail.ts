import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService } from '../../services/blog.service';
import { I18nService } from '../../services/i18n.service';
import { BlogPost } from '../../interfaces/blog-post.interface';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-blog-detail',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.css',
  encapsulation: ViewEncapsulation.None,
})
export class BlogDetail implements OnInit {
  post = signal<BlogPost | null>(null);
  loading = signal<boolean>(true);
  safeContent = signal<SafeHtml>('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly blogService: BlogService,
    private readonly i18nService: I18nService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadPost(slug);
    }
  }

  private loadPost(slug: string) {
    const language = this.i18nService.getLocale();
    this.blogService.getPostBySlug(slug, language).subscribe((post) => {
      if (post) {
        this.post.set(post);
        this.safeContent.set(this.sanitizer.bypassSecurityTrustHtml(post.content));
      }
      this.loading.set(false);
    });
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat(this.i18nService.getLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, forkJoin, switchMap, shareReplay } from 'rxjs';
import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';
import { BlogPost, BlogPostMetadata } from '../interfaces/blog-post.interface';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private readonly postsCache: Map<string, BlogPost[]> = new Map();
  private readonly postsObservables: Map<string, Observable<BlogPost[]>> = new Map();

  constructor(private readonly http: HttpClient) {
    const renderer = new Renderer();

    renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(text, { language: lang }).value;
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        } catch (err) {
          console.error('Highlight error:', err);
        }
      }
      const highlighted = hljs.highlightAuto(text).value;
      return `<pre><code class="hljs">${highlighted}</code></pre>`;
    };

    marked.setOptions({
      gfm: true,
      breaks: true,
      renderer,
    });
  }

  getPosts(language: 'en' | 'es'): Observable<BlogPost[]> {
    // Return cached data if available
    if (this.postsCache.has(language)) {
      return of(this.postsCache.get(language)!);
    }

    // Return existing observable if already loading
    if (this.postsObservables.has(language)) {
      return this.postsObservables.get(language)!;
    }

    // Create new observable and cache it
    const postsObservable = this.http
      .get<string[]>(`/assets/posts/${language}/index.json`, { responseType: 'json' })
      .pipe(
        switchMap((slugs) => {
          if (slugs.length === 0) {
            return of([]);
          }

          const postObservables = slugs.map((slug) => this.loadPost(slug, language));
          return forkJoin(postObservables);
        }),
        map((posts) => {
          const validPosts = posts.filter((post): post is BlogPost => post !== null);
          validPosts.sort((a, b) => b.date.getTime() - a.date.getTime());
          this.postsCache.set(language, validPosts);
          // Remove from observables cache once completed
          this.postsObservables.delete(language);
          return validPosts;
        }),
        catchError(() => {
          console.warn(`No posts found for language: ${language}`);
          this.postsObservables.delete(language);
          return of([]);
        }),
        shareReplay(1), // Share the result to prevent multiple HTTP calls
      );

    // Cache the observable
    this.postsObservables.set(language, postsObservable);
    return postsObservable;
  }

  getPostBySlug(slug: string, language: 'en' | 'es'): Observable<BlogPost | null> {
    return this.loadPost(slug, language);
  }

  private loadPost(slug: string, language: 'en' | 'es'): Observable<BlogPost | null> {
    return this.http.get(`/assets/posts/${language}/${slug}.md`, { responseType: 'text' }).pipe(
      map((markdown) => {
        const { metadata, content } = this.parseMarkdown(markdown);
        const htmlContent = marked.parse(content) as string;

        const dateParts = metadata.date.split('-');
        const postDate =
          dateParts.length === 3
            ? new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
            : new Date(metadata.date);

        return {
          id: slug,
          slug: metadata.slug || slug,
          title: metadata.title,
          date: postDate,
          description: metadata.description,
          tags: metadata.tags || [],
          content: htmlContent,
          language,
          author: metadata.author,
          readingTime: this.calculateReadingTime(content),
          imageUrl: metadata.imageUrl,
        };
      }),
      catchError((error) => {
        console.error(`Error loading post ${slug}:`, error);
        return of(null);
      }),
      shareReplay(1), // Share the result to prevent multiple HTTP calls for the same post
    );
  }

  private parseMarkdown(markdown: string): {
    metadata: BlogPostMetadata;
    content: string;
  } {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = frontmatterRegex.exec(markdown);

    if (!match) {
      return {
        metadata: {
          title: 'Untitled',
          date: new Date().toISOString(),
          description: '',
          tags: [],
          slug: '',
        },
        content: markdown,
      };
    }

    const frontmatter = match[1];
    const content = match[2];

    const metadata: any = {};
    frontmatter.split(/\r?\n/).forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();

        if (value.startsWith('[') && value.endsWith(']')) {
          metadata[key.trim()] = value
            .slice(1, -1)
            .split(',')
            .map((item) => item.trim().replaceAll(/['"]/g, ''));
        } else {
          metadata[key.trim()] = value.replaceAll(/['"]/g, '');
        }
      }
    });

    return { metadata: metadata as BlogPostMetadata, content };
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  filterByTag(posts: BlogPost[], tag: string): BlogPost[] {
    return posts.filter((post) => post.tags.includes(tag));
  }

  getPostImage(post: BlogPost): string {
    return (
      post.imageUrl ||
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=192&fit=crop'
    );
  }

  searchPosts(posts: BlogPost[], query: string): BlogPost[] {
    const lowerQuery = query.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(lowerQuery) ||
        post.description.toLowerCase().includes(lowerQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  getAllTags(posts: BlogPost[]): string[] {
    const tagsSet = new Set<string>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }
}

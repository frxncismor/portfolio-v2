export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: Date;
  description: string;
  tags: string[];
  content: string;
  language: 'en' | 'es';
  author?: string;
  readingTime?: number;
  imageUrl?: string;
}

export interface BlogPostMetadata {
  title: string;
  date: string;
  description: string;
  tags: string[];
  slug: string;
  author?: string;
  imageUrl?: string;
}

export interface Project {
  title: string;
  slug: string;
  description: string;
  featured: boolean;
  technologies: string[];
  category: string;
  liveUrl?: string;
  githubUrl?: string;
  featuredImage: string;
  galleryImages?: string[];
  publishedDate: string;
  content?: string;
}

export interface BlogPost {
  title: string;
  slug: string;
  description: string;
  featured: boolean;
  author: string;
  publishedDate: string;
  categories: string[];
  tags: string[];
  featuredImage: string;
  content: string;
  readingTime?: number;
}

export interface Category {
  name: string;
  slug: string;
  count: number;
}

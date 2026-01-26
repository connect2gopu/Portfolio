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

export interface ResumeData {
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    summary: string;
    yearsOfExperience?: string;
  };
  experiences: {
    company: string;
    role: string;
    period: string;
    description: string;
    logo?: string;
  }[];
  education: {
    degree: string;
    institution: string;
    grade?: string;
    period: string;
    location?: string;
  }[];
  skills: {
    category: string;
    skills: string[];
  }[];
}

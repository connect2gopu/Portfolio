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

export interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  [key: string]: string | undefined;
}

export interface WorkExperience {
  company: string;
  role: string;
  period: string;
  startDate?: string;
  endDate?: string;
  description: string;
  location?: string;
  logo?: string;
  links?: Array<{ text: string; url: string }>;
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  location?: string;
  description?: string;
  links?: Array<{ text: string; url: string }>;
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface Resume {
  personalInfo: {
    name: string;
    title?: string;
    summary?: string;
    bio?: string;
    contact: ContactInfo;
  };
  workExperience: WorkExperience[];
  education: Education[];
  skills: SkillCategory[];
  links?: Array<{ text: string; url: string }>;
  extractedAt: string;
  sourceFile: string;
}

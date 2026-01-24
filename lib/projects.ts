import { Project } from "@/types";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const projectsDirectory = path.join(process.cwd(), "content/projects");

export function getProjectSlugs(): string[] {
  if (!fs.existsSync(projectsDirectory)) {
    return [];
  }
  return fs.readdirSync(projectsDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getProjectBySlug(slug: string): Project | null {
  try {
    const fullPath = path.join(projectsDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      title: data.title || "",
      slug: data.slug || slug,
      description: data.description || "",
      featured: data.featured || false,
      technologies: data.technologies || [],
      category: data.category || "",
      liveUrl: data.liveUrl,
      githubUrl: data.githubUrl,
      featuredImage: data.featuredImage || "",
      galleryImages: data.galleryImages || [],
      publishedDate: data.publishedDate || new Date().toISOString(),
      content,
    };
  } catch (error) {
    console.error(`Error reading project ${slug}:`, error);
    return null;
  }
}

export function getAllProjects(): Project[] {
  const slugs = getProjectSlugs();
  const projects = slugs
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is Project => project !== null)
    .sort((a, b) => {
      const dateA = new Date(a.publishedDate).getTime();
      const dateB = new Date(b.publishedDate).getTime();
      return dateB - dateA;
    });

  return projects;
}

export function getFeaturedProjects(limit: number = 4): Project[] {
  return getAllProjects()
    .filter((project) => project.featured)
    .slice(0, limit);
}

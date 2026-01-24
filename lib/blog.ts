import { BlogPost } from "@/types";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const blogDirectory = path.join(process.cwd(), "content/blog");

export function getBlogSlugs(): string[] {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }
  return fs.readdirSync(blogDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(blogDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    const readingTimeResult = readingTime(content);

    return {
      title: data.title || "",
      slug: data.slug || slug,
      description: data.description || "",
      featured: data.featured || false,
      author: data.author || "",
      publishedDate: data.publishedDate || new Date().toISOString(),
      categories: data.categories || [],
      tags: data.tags || [],
      featuredImage: data.featuredImage || "",
      content,
      readingTime: Math.ceil(readingTimeResult.minutes),
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

export function getAllBlogPosts(): BlogPost[] {
  const slugs = getBlogSlugs();
  const posts = slugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => {
      const dateA = new Date(a.publishedDate).getTime();
      const dateB = new Date(b.publishedDate).getTime();
      return dateB - dateA;
    });

  return posts;
}

export function getFeaturedBlogPosts(limit: number = 4): BlogPost[] {
  return getAllBlogPosts()
    .filter((post) => post.featured)
    .slice(0, limit);
}

export function getLatestBlogPosts(limit: number = 4): BlogPost[] {
  return getAllBlogPosts().slice(0, limit);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return getAllBlogPosts().filter((post) =>
    post.categories.some((cat) => cat.toLowerCase() === category.toLowerCase())
  );
}

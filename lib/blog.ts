import { BlogPost } from "@/types";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const blogDirectory = path.join(process.cwd(), "content/blog");
const postsDirectory = path.join(process.cwd(), "content/posts");

export function getBlogSlugs(): string[] {
  const slugs: string[] = [];

  if (fs.existsSync(blogDirectory)) {
    fs.readdirSync(blogDirectory)
      .filter((file) => file.endsWith(".mdx"))
      .forEach((file) => slugs.push(file.replace(/\.mdx$/, "")));
  }

  if (fs.existsSync(postsDirectory)) {
    fs.readdirSync(postsDirectory)
      .filter((file) => file.endsWith(".md"))
      .forEach((file) => {
        const slug = file.replace(/\.md$/, "");
        if (!slugs.includes(slug)) slugs.push(slug);
      });
  }

  return slugs;
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  try {
    // Try content/blog/*.mdx first
    const mdxPath = path.join(blogDirectory, `${slug}.mdx`);
    const mdPath = path.join(postsDirectory, `${slug}.md`);

    let fullPath: string;
    if (fs.existsSync(mdxPath)) {
      fullPath = mdxPath;
    } else if (fs.existsSync(mdPath)) {
      fullPath = mdPath;
    } else {
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
      draft: data.draft || false,
      devtoUrl: data.devtoUrl || "",
      mediumUrl: data.mediumUrl || "",
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

export function getAllBlogPosts(): BlogPost[] {
  const isDev = process.env.NODE_ENV === "development";
  const slugs = getBlogSlugs();
  const posts = slugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((post): post is BlogPost => post !== null)
    .filter((post) => isDev || !post.draft)
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

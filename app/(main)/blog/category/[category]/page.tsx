import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllBlogPosts, getBlogPostsByCategory } from "@/lib/blog";
import { BlogGrid } from "@/components/blog/BlogGrid";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  const categories = new Set<string>();
  
  posts.forEach((post) => {
    post.categories.forEach((cat) => {
      categories.add(cat.toLowerCase().replace(/\s+/g, "-"));
    });
  });

  return Array.from(categories).map((category) => ({
    category,
  }));
}

export default function CategoryPage({ params }: CategoryPageProps) {
  // Convert URL slug back to category name
  const categoryName = params.category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const posts = getBlogPostsByCategory(categoryName);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Blog
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Category: {categoryName}
        </h1>
        <p className="text-lg text-muted-foreground">
          {posts.length} {posts.length === 1 ? "post" : "posts"} in this category
        </p>
      </div>
      <BlogGrid posts={posts} />
    </div>
  );
}

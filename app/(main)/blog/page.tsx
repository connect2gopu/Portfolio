import { BlogGrid } from "@/components/blog/BlogGrid";
import { getAllBlogPosts, getFeaturedBlogPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";

export default function BlogPage() {
  const allPosts = getAllBlogPosts();
  const featuredPosts = getFeaturedBlogPosts(3);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Thoughts, tutorials, and insights on web development, programming, and technology.
        </p>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Featured Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* All Posts */}
      <section>
        <h2 className="text-2xl font-bold mb-6">All Posts</h2>
        <BlogGrid posts={allPosts} />
      </section>
    </div>
  );
}


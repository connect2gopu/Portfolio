import { BlogPost } from "@/types";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { BlogPostImage } from "@/components/blog/BlogPostImage";

interface LatestBlogPostsProps {
  posts: BlogPost[];
}

export function LatestBlogPosts({ posts }: LatestBlogPostsProps) {
  if (posts.length === 0) {
    return (
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Latest Blog Posts</h2>
            <p className="text-muted-foreground">Thoughts, tutorials, and insights</p>
          </div>
          <Button href="/blog" variant="outline">
            View All
          </Button>
        </div>
        <p className="text-center text-muted-foreground py-12">
          No blog posts yet. Check back soon!
        </p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-24 bg-muted/30">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Latest Blog Posts</h2>
          <p className="text-muted-foreground">Thoughts, tutorials, and insights</p>
        </div>
        <Button href="/blog" variant="outline">
          View All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card hover className="h-full flex flex-col">
              <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-muted">
                <BlogPostImage
                  src={post.featuredImage}
                  alt={post.title}
                  title={post.title}
                  categories={post.categories}
                />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-2">
                  <span>{formatDate(post.publishedDate)}</span>
                  {post.readingTime && (
                    <>
                      <span>•</span>
                      <span>{post.readingTime} min read</span>
                    </>
                  )}
                </div>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {post.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {post.categories.slice(0, 2).map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

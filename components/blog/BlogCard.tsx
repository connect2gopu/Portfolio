import { BlogPost } from "@/types";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { BlogPostImage } from "./BlogPostImage";

interface BlogCardProps {
  post: BlogPost;
  animationDelay?: number;
}

export function BlogCard({ post, animationDelay = 0 }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="animate-fade-in-up" style={{ animationDelay: `${animationDelay}ms` }}>
      <Card hover className="h-full flex flex-col group">
        {/* Image — 16:9 aspect ratio */}
        <div className="relative w-full aspect-video overflow-hidden rounded-t-lg bg-muted">
          <BlogPostImage
            src={post.featuredImage}
            alt={post.title}
            title={post.title}
            categories={post.categories}
          />
          {post.featured && (
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full shadow-sm">
                Featured
              </span>
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          {/* Metadata row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 mb-2.5">
            <span className="font-medium">{formatDate(post.publishedDate)}</span>
            {post.readingTime && (
              <>
                <span aria-hidden>•</span>
                <span>{post.readingTime} min read</span>
              </>
            )}
          </div>
          <CardTitle className="line-clamp-2 text-lg leading-snug group-hover:text-primary transition-colors duration-200">
            {post.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 leading-relaxed">
            {post.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {post.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors duration-150 cursor-pointer"
              >
                {category}
              </span>
            ))}
            {post.categories.length > 2 && (
              <span className="px-2.5 py-0.5 text-xs text-muted-foreground border border-border rounded-full">
                +{post.categories.length - 2} more
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

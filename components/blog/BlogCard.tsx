import { BlogPost } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card hover className="h-full flex flex-col">
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-muted">
          {post.featuredImage && post.featuredImage.startsWith("/") ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          ) : post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          {post.featured && (
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md">
                Featured
              </span>
            </div>
          )}
        </div>
        <CardHeader>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
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
            {post.categories.length > 2 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                +{post.categories.length - 2} more
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

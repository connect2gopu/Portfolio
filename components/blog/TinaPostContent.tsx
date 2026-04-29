"use client";
import { useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import { PostQuery, PostQueryVariables } from "@/tina/__generated__/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { SocialShare } from "./SocialShare";

interface TinaPostContentProps {
  query: string;
  variables: PostQueryVariables;
  data: PostQuery;
}

export function TinaPostContent({ query, variables, data }: TinaPostContentProps) {
  const { data: liveData } = useTina({ query, variables, data });
  const post = liveData.post;

  const publishedDate = post.publishedDate || new Date().toISOString();
  const categories = (post.categories?.filter(Boolean) as string[]) ?? [];
  const tags = (post.tags?.filter(Boolean) as string[]) ?? [];

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
        {post.description && (
          <p className="text-xl text-muted-foreground mb-6">{post.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <span>{formatDate(publishedDate)}</span>
          {post.author && (
            <>
              <span>•</span>
              <span>By {post.author}</span>
            </>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/blog/category/${category.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                {category}
              </Link>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {post.featuredImage && (
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-muted mt-8">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </header>

      {post.body && (
        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
          <TinaMarkdown content={post.body} />
        </div>
      )}

      <div className="border-t pt-8 mb-12">
        <SocialShare
          url={`/blog/${post._sys.filename}`}
          title={post.title}
          description={post.description ?? ""}
        />
      </div>
    </article>
  );
}

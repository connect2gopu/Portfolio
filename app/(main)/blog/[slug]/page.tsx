import { notFound } from "next/navigation";
import { getBlogPostBySlug, getBlogSlugs, getAllBlogPosts } from "@/lib/blog";
import { MDXContent } from "@/components/mdx/MDXContent";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { SocialShare } from "@/components/blog/SocialShare";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { BlogCard } from "@/components/blog/BlogCard";
import { TinaPostContent } from "@/components/blog/TinaPostContent";
import { generateSEO } from "@/lib/seo";
import { Metadata } from "next";
import client from "@/tina/__generated__/client";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  // Try TinaCMS first
  try {
    const tinaResult = await client.queries.post({ relativePath: `${params.slug}.md` });
    const post = tinaResult.data.post;
    return generateSEO({
      title: `${post.title} | Blog`,
      description: post.description ?? "",
      url: `/blog/${params.slug}`,
      type: "article",
      image: post.featuredImage ?? "",
      publishedTime: post.publishedDate ?? "",
      author: post.author ?? "",
      tags: (post.tags?.filter(Boolean) as string[]) ?? [],
    });
  } catch {
    // Fall back to filesystem
  }

  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    return {};
  }

  return generateSEO({
    title: `${post.title} | Blog`,
    description: post.description,
    url: `/blog/${post.slug}`,
    type: "article",
    image: post.featuredImage,
    publishedTime: post.publishedDate,
    author: post.author,
    tags: post.tags,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // Try TinaCMS GraphQL first (enables visual editing in the CMS sidebar)
  let tinaResult: Awaited<ReturnType<typeof client.queries.post>> | null = null;
  try {
    tinaResult = await client.queries.post({ relativePath: `${params.slug}.md` });
  } catch {
    // Post not in TinaCMS or GraphQL server not running — fall through to filesystem
  }

  const allPosts = getAllBlogPosts();

  if (tinaResult) {
    const tinaPost = tinaResult.data.post;
    const categories = (tinaPost.categories?.filter(Boolean) as string[]) ?? [];
    const relatedPosts = allPosts
      .filter((p) => p.slug !== params.slug && p.categories.some((cat) => categories.includes(cat)))
      .slice(0, 3);

    return (
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <TinaPostContent
              query={tinaResult.query}
              variables={tinaResult.variables}
              data={tinaResult.data}
            />

            {relatedPosts.length > 0 && (
              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <BlogCard key={relatedPost.slug} post={relatedPost} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Fallback: filesystem (for content/blog/*.mdx posts)
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = allPosts
    .filter(
      (p) =>
        p.slug !== post.slug &&
        p.categories.some((cat) => post.categories.includes(cat))
    )
    .slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <article className="lg:col-span-3">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            <p className="text-xl text-muted-foreground mb-6">{post.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span>{formatDate(post.publishedDate)}</span>
              {post.readingTime && (
                <>
                  <span>•</span>
                  <span>{post.readingTime} min read</span>
                </>
              )}
              {post.author && (
                <>
                  <span>•</span>
                  <span>By {post.author}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories.map((category) => (
                <Link
                  key={category}
                  href={`/blog/category/${category.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                >
                  {category}
                </Link>
              ))}
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {(post.devtoUrl || post.mediumUrl) && (
              <div className="flex flex-wrap items-center gap-2 mt-4 text-sm text-muted-foreground">
                <span>Also published on</span>
                {post.devtoUrl && (
                  <a href={post.devtoUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">
                    Dev.to
                  </a>
                )}
                {post.devtoUrl && post.mediumUrl && <span>and</span>}
                {post.mediumUrl && (
                  <a href={post.mediumUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">
                    Medium
                  </a>
                )}
              </div>
            )}

            {post.featuredImage && (
              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-muted mt-8">
                {post.featuredImage.startsWith("/") ? (
                  <Image src={post.featuredImage} alt={post.title} fill className="object-cover" />
                ) : (
                  <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
                )}
              </div>
            )}
          </header>

          {post.content && (
            <div className="mb-12">
              <MDXContent source={post.content} />
            </div>
          )}

          <div className="border-t pt-8 mb-12">
            <SocialShare url={`/blog/${post.slug}`} title={post.title} description={post.description} />
          </div>

          {relatedPosts.length > 0 && (
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard key={relatedPost.slug} post={relatedPost} />
                ))}
              </div>
            </div>
          )}
        </article>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            <TableOfContents />
          </div>
        </aside>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { getBlogPostBySlug, getBlogSlugs, getAllBlogPosts } from "@/lib/blog";
import { serializeMDX } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { SocialShare } from "@/components/blog/SocialShare";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { BlogCard } from "@/components/blog/BlogCard";
import { generateSEO } from "@/lib/seo";
import { Metadata } from "next";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const slugs = getBlogSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
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
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const mdxSource = post.content ? await serializeMDX(post.content) : null;
  const allPosts = getAllBlogPosts();
  
  // Get related posts (same category, excluding current post)
  const relatedPosts = allPosts
    .filter(
      (p) =>
        p.slug !== post.slug &&
        p.categories.some((cat) => post.categories.includes(cat))
    )
    .slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      {/* Back Button */}
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
        {/* Main Content */}
        <article className="lg:col-span-3">
          {/* Header */}
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

            {/* Categories and Tags */}
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

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-muted mt-8">
                {post.featuredImage.startsWith("/") ? (
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
          </header>

          {/* MDX Content */}
          {mdxSource && (
            <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
              <MDXRemote {...mdxSource} />
            </div>
          )}

          {/* Social Share */}
          <div className="border-t pt-8 mb-12">
            <SocialShare
              url={`/blog/${post.slug}`}
              title={post.title}
              description={post.description}
            />
          </div>

          {/* Related Posts */}
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

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            <TableOfContents />
          </div>
        </aside>
      </div>
    </div>
  );
}

import { Metadata } from "next";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}

export function generateSEO({
  title = "Portfolio | Your Name",
  description = "Software developer, technical writer & open-source maintainer",
  image = "/og-image.jpg",
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  tags,
}: SEOProps = {}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
  const fullImageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: "Your Portfolio",
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(tags && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullImageUrl],
    },
    alternates: {
      canonical: fullUrl,
      types: {
        "application/rss+xml": `${siteUrl}/api/rss`,
      },
    },
  };
}

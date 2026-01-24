import { getAllBlogPosts } from "@/lib/blog";
import { NextResponse } from "next/server";

export async function GET() {
  const posts = getAllBlogPosts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Your Portfolio Blog</title>
    <description>Latest blog posts and articles</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${posts
      .map((post) => {
        const postUrl = `${siteUrl}/blog/${post.slug}`;
        const pubDate = new Date(post.publishedDate).toUTCString();
        const description = post.description
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

        return `
    <item>
      <title>${post.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
      <description>${description}</description>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.author ? `<author>${post.author}</author>` : ""}
      ${post.categories.map((cat) => `<category>${cat}</category>`).join("")}
    </item>`;
      })
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

import { Hero } from "@/components/home/Hero";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { LatestBlogPosts } from "@/components/home/LatestBlogPosts";
import { SkillsShowcase } from "@/components/home/SkillsShowcase";
import { getFeaturedProjects } from "@/lib/projects";
import { getLatestBlogPosts } from "@/lib/blog";
import { generateSEO } from "@/lib/seo";
import { Metadata } from "next";

export const metadata: Metadata = generateSEO({
  title: "Home | Portfolio",
  description: "Software developer, technical writer & open-source maintainer. Welcome to my portfolio.",
});

export default function Home() {
  const featuredProjects = getFeaturedProjects(3);
  const latestPosts = getLatestBlogPosts(3);

  return (
    <>
      <Hero />
      <FeaturedProjects projects={featuredProjects} />
      <LatestBlogPosts posts={latestPosts} />
      <SkillsShowcase />
    </>
  );
}

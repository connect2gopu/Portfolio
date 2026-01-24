import { Hero } from "@/components/home/Hero";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { LatestBlogPosts } from "@/components/home/LatestBlogPosts";
import { SkillsShowcase } from "@/components/home/SkillsShowcase";
import { getFeaturedProjects } from "@/lib/projects";
import { getLatestBlogPosts } from "@/lib/blog";

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

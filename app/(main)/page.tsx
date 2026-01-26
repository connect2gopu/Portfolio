import { Hero } from "@/components/home/Hero";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { LatestBlogPosts } from "@/components/home/LatestBlogPosts";
import { SkillsShowcase } from "@/components/home/SkillsShowcase";
import { getFeaturedProjects } from "@/lib/projects";
import { getLatestBlogPosts } from "@/lib/blog";
import { getPersonalInfo } from "@/lib/resume";
import { generateSEO } from "@/lib/seo";
import { Metadata } from "next";

export const metadata: Metadata = (() => {
  const personalInfo = getPersonalInfo();
  const experienceText = personalInfo.yearsOfExperience
    ? `${personalInfo.yearsOfExperience}+ years`
    : "7+ years";
  
  return generateSEO({
    title: `${personalInfo.name} | ${personalInfo.title}`,
    description: `${personalInfo.title} with ${experienceText} of experience building scalable web applications and leading cross-functional teams.`,
  });
})();

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

import { ExperienceTimeline } from "@/components/about/ExperienceTimeline";
import { AboutSkills } from "@/components/about/AboutSkills";
import { ResumeDownload } from "@/components/about/ResumeDownload";
import { SocialLinks } from "@/components/about/SocialLinks";
import { generateSEO } from "@/lib/seo";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = generateSEO({
  title: "About | Portfolio",
  description: "Learn more about my experience, skills, and background as a software developer.",
  url: "/about",
});

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-accent p-1 mb-6">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">YP</span>
            </div>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Software Developer, Technical Writer & Open-Source Maintainer
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          I'm passionate about learning and building open-source software that is beneficial to developers and the world at large. With experience in modern web technologies, I enjoy creating solutions that make a difference.
        </p>
      </div>

      {/* Resume Download */}
      <div className="mb-16">
        <ResumeDownload />
      </div>

      {/* Experience Timeline */}
      <div className="mb-16">
        <ExperienceTimeline />
      </div>

      {/* Skills Section */}
      <div className="mb-16">
        <AboutSkills />
      </div>

      {/* Social Links */}
      <div>
        <SocialLinks />
      </div>
    </div>
  );
}


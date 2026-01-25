import { ExperienceTimeline } from "@/components/about/ExperienceTimeline";
import { AboutSkills } from "@/components/about/AboutSkills";
import { ResumeDownload } from "@/components/about/ResumeDownload";
import { SocialLinks } from "@/components/about/SocialLinks";
import { Education } from "@/components/about/Education";
import { generateSEO } from "@/lib/seo";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = generateSEO({
  title: "About | Gopal sharma",
  description: "Learn more about Gopal sharma's 7+ years of experience as a Team Lead and Full-Stack Developer, including work at Info Edge India Ltd (99acres) and So City.",
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
              <span className="text-4xl font-bold text-primary">GS</g/g/span>
            </div>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Gopal sharma
        </h1>
        <p className="text-xl md:text-2xl text-primary font-medium mb-4">
          Team Lead (Software Engineering) & Full-Stack Developer
        </p>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          A passionate software engineer with 7+ years of experience building scalable web applications, leading cross-functional teams, and delivering high-impact product features that enhance user experience and drive business growth.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <a href="mailto:connect2gopu@gmail.com" className="hover:text-primary transition-colors">
            connect2gopu@gmail.com
          </a>
          <span>•</span>
          <span>+919069367364</span>
        </div>
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

      {/* Education */}
      <div className="mb-16">
        <Education />
      </div>

      {/* Social Links */}
      <div>
        <SocialLinks />
      </div>
    </div>
  );
}


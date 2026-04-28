import { ExperienceTimeline } from "@/components/about/ExperienceTimeline";
import { AboutSkills } from "@/components/about/AboutSkills";
import { ResumeDownload } from "@/components/about/ResumeDownload";
import { SocialLinks } from "@/components/about/SocialLinks";
import { Education } from "@/components/about/Education";
import { generateSEO } from "@/lib/seo";
import { Metadata } from "next";
import { personalInfo, experiences } from "@/data/resume";

export const metadata: Metadata = generateSEO({
  title: "About | Gopal Sharma",
  description: "Learn more about Gopal Sharma's 7+ years of experience as a Team Lead and Full-Stack Developer, including work at Info Edge India Ltd (99acres) and So City.",
  url: "/about",
});

export default function AboutPage() {
  const name = personalInfo.name.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
  const currentRole = experiences[0]?.position || "Full-Stack Developer";
  const initials = name.split(' ').map(n => n[0]).join('');

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-accent p-1 mb-6">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">{initials}</span>
            </div>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {name}
        </h1>
        <p className="text-xl md:text-2xl text-primary font-medium mb-4">
          {currentRole} & Full-Stack Developer
        </p>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          A passionate software engineer with 7+ years of experience building scalable web applications, leading cross-functional teams, and delivering high-impact product features that enhance user experience and drive business growth.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <a href={`mailto:${personalInfo.email}`} className="hover:text-primary transition-colors">
            {personalInfo.email}
          </a>
          {personalInfo.phone && (
            <>
              <span>•</span>
              <span>{personalInfo.phone}</span>
            </>
          )}
        </div>
      </div>

      {/* What I do */}
      <div className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Frontend Architecture</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Building scalable React &amp; Next.js applications with Microfrontend patterns, Core Web Vitals optimization, and performance-first design.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Team Leadership</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Leading cross-functional engineering teams, driving roadmap execution, mentoring engineers, and fostering a culture of technical excellence.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">System Design</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Architecting high-availability systems with CDN caching, BFF patterns, A/B testing infrastructure, and event-driven analytics.
            </p>
          </div>
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


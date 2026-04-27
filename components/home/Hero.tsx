import { Button } from "@/components/ui/Button";
import { personalInfo, experiences } from "@/data/resume";

export function Hero() {
  const currentRole = experiences[0]?.position || "Full-Stack Developer";
  const name = personalInfo.name.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');

  return (
    <section className="container mx-auto px-4 py-20 md:py-32">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-base md:text-lg font-medium text-muted-foreground mb-3 tracking-wide uppercase">
          Hi, I&apos;m
        </p>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
          {name}
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-foreground/80 mb-6">
          {currentRole} &amp; Full-Stack Developer
        </p>
        <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          A passionate software engineer with 7+ years of experience building scalable web applications, leading cross-functional teams, and delivering high-impact product features that enhance user experience and drive business growth.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/projects" size="lg" className="text-base">
            View Projects
          </Button>
          <Button href="/contact" variant="outline" size="lg" className="text-base">
            Get In Touch
          </Button>
        </div>
      </div>
    </section>
  );
}

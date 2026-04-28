import { Button } from "@/components/ui/Button";
import { personalInfo, experiences } from "@/data/resume";

export function Hero() {
  const currentRole = experiences[0]?.position || "Full-Stack Developer";
  const name = personalInfo.name.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');

  return (
    <section className="relative container mx-auto px-4 min-h-[calc(100vh-5rem)] flex flex-col justify-center">
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-base md:text-lg font-medium text-muted-foreground mb-3 tracking-wide uppercase">
          Hi, I&apos;m
        </p>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
          {name}
        </h1>
        <p className="text-xl md:text-2xl font-semibold mb-2">
          <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
            {currentRole}
          </span>
        </p>
        <p className="text-base md:text-lg text-muted-foreground/80 mb-3 font-medium">
          7+ Years · Full-Stack · Microfrontend · Team Builder
        </p>
        <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          I ship products that scale — from architecting Microfrontend systems at 99acres to mentoring engineers and cutting load times by 40%.
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

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/60 animate-bounce">
        <span className="text-[10px] tracking-widest uppercase font-medium">Scroll</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

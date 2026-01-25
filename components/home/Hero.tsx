import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="container mx-auto px-4 py-20 md:py-32">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Software developer, technical writer & open-source maintainer
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          I&apos;m passionate about learning and building open-source software that is beneficial to developers and the world at large.
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

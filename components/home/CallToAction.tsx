import { Button } from "@/components/ui/Button";

export function CallToAction() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-12 shadow-sm">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Let&apos;s Build Something Together
        </h2>
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          I&apos;m always open to discussing new opportunities, interesting projects,
          or just a good conversation about tech. Reach out and let&apos;s talk.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/contact" size="lg" className="text-base">
            Let&apos;s Talk
          </Button>
          <Button href="/about" variant="outline" size="lg" className="text-base">
            More About Me
          </Button>
        </div>
      </div>
    </section>
  );
}

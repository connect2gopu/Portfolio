import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-32 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/" size="lg">
            Go Home
          </Button>
          <Button href="/blog" variant="outline" size="lg">
            Read Blog
          </Button>
        </div>
      </div>
    </div>
  );
}

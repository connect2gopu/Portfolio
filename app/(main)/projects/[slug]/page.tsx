import { notFound } from "next/navigation";
import { getProjectBySlug, getProjectSlugs } from "@/lib/projects";
import { serializeMDX } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface ProjectPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const slugs = getProjectSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  const mdxSource = project.content
    ? await serializeMDX(project.content)
    : null;

  return (
    <article className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Projects
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{project.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{project.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>{formatDate(project.publishedDate)}</span>
              {project.category && (
                <>
                  <span>•</span>
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                    {project.category}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {project.featuredImage && (
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-muted mb-8">
            {project.featuredImage.startsWith("/") ? (
              <Image
                src={project.featuredImage}
                alt={project.title}
                fill
                className="object-cover"
              />
            ) : (
              <img
                src={project.featuredImage}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Technologies */}
        {project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          {project.liveUrl && (
            <Button href={project.liveUrl} size="lg">
              View Live Demo
            </Button>
          )}
          {project.githubUrl && (
            <Button href={project.githubUrl} variant="outline" size="lg">
              View on GitHub
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      {mdxSource && (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <MDXRemote {...mdxSource} />
        </div>
      )}

      {/* Gallery */}
      {project.galleryImages && project.galleryImages.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.galleryImages.map((image, index) => (
              <div
                key={index}
                className="relative w-full h-64 rounded-lg overflow-hidden bg-muted"
              >
                {image.startsWith("/") ? (
                  <Image
                    src={image}
                    alt={`${project.title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <img
                    src={image}
                    alt={`${project.title} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

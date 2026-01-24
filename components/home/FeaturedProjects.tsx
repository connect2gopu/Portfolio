import { Project } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FeaturedProjectsProps {
  projects: Project[];
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  if (projects.length === 0) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Projects</h2>
            <p className="text-muted-foreground">Some of my recent work</p>
          </div>
          <Button href="/projects" variant="outline">
            View All
          </Button>
        </div>
        <p className="text-center text-muted-foreground py-12">
          No projects yet. Check back soon!
        </p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Projects</h2>
          <p className="text-muted-foreground">Some of my recent work</p>
        </div>
        <Button href="/projects" variant="outline">
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.slug} hover className="flex flex-col">
            <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-muted">
              {project.featuredImage && project.featuredImage.startsWith("/") ? (
                <Image
                  src={project.featuredImage}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              ) : project.featuredImage ? (
                // External image
                <img
                  src={project.featuredImage}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-1">{project.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                  >
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 3 && (
                  <span className="px-2 py-1 text-xs text-muted-foreground">
                    +{project.technologies.length - 3} more
                  </span>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              {project.liveUrl && (
                <Button
                  href={project.liveUrl}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Live Demo
                </Button>
              )}
              {project.githubUrl && (
                <Button
                  href={project.githubUrl}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  GitHub
                </Button>
              )}
              <Button
                href={`/projects/${project.slug}`}
                variant="default"
                size="sm"
                className="flex-1"
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

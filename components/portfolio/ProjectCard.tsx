import { Project } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card hover className="flex flex-col h-full">
      <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-muted">
        {project.featuredImage && project.featuredImage.startsWith("/") ? (
          <Image
            src={project.featuredImage}
            alt={project.title}
            fill
            className="object-cover"
          />
        ) : project.featuredImage ? (
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
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="line-clamp-1 flex-1">{project.title}</CardTitle>
          {project.featured && (
            <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md whitespace-nowrap">
              Featured
            </span>
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                +{project.technologies.length - 4} more
              </span>
            )}
          </div>
          {project.category && (
            <div>
              <span className="text-xs text-muted-foreground">Category: </span>
              <span className="text-xs font-medium">{project.category}</span>
            </div>
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
  );
}

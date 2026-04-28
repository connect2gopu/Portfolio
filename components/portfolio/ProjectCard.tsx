import { Project } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ProjectCardProps {
  project: Project;
}

const TECH_COLORS: Record<string, string> = {
  "React": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "React.js": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Next.js": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "TypeScript": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "JavaScript": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Node.js": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Express": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  "Express.js": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  "MongoDB": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "PostgreSQL": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "MySQL": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Redis": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "GraphQL": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "AWS": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Docker": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "TailwindCSS": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  "Redux": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Python": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Firebase": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const TECH_DESCRIPTIONS: Record<string, string> = {
  "React": "UI component library",
  "React.js": "UI component library",
  "Next.js": "SSR & file-based routing",
  "TypeScript": "Type-safe JavaScript",
  "JavaScript": "Dynamic web scripting",
  "Node.js": "Server-side JS runtime",
  "Express": "RESTful API server",
  "Express.js": "RESTful API server",
  "MongoDB": "NoSQL document database",
  "PostgreSQL": "Relational SQL database",
  "MySQL": "Relational SQL database",
  "Redis": "In-memory caching layer",
  "GraphQL": "Flexible API query language",
  "AWS": "Cloud infrastructure",
  "Docker": "Container orchestration",
  "TailwindCSS": "Utility-first CSS styling",
  "Redux": "Global state management",
  "Python": "Backend scripting & data",
  "Firebase": "Real-time DB & auth",
};

function getTechColor(tech: string): string {
  return TECH_COLORS[tech] ?? "bg-primary/10 text-primary";
}

function ProjectPlaceholder({ title, category }: { title: string; category?: string }) {
  const initials = title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 gap-2">
      <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center border border-primary/20">
        <span className="text-2xl font-bold text-primary">{initials}</span>
      </div>
      {category && (
        <span className="text-xs text-muted-foreground">{category}</span>
      )}
    </div>
  );
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
          <ProjectPlaceholder title={project.title} category={project.category} />
        )}
        {project.featured && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full shadow-sm">
              Featured
            </span>
          </div>
        )}
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 text-lg leading-snug">{project.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 5).map((tech) => (
            <div key={tech} className="relative group/tooltip">
              <span
                className={`px-2.5 py-0.5 text-xs font-medium rounded-full cursor-default ${getTechColor(tech)}`}
              >
                {tech}
              </span>
              {TECH_DESCRIPTIONS[tech] && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-xs rounded-md bg-foreground text-background whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg"
                  role="tooltip"
                >
                  {TECH_DESCRIPTIONS[tech]}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                </div>
              )}
            </div>
          ))}
          {project.technologies.length > 5 && (
            <span className="px-2.5 py-0.5 text-xs text-muted-foreground border border-border rounded-full">
              +{project.technologies.length - 5} more
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
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

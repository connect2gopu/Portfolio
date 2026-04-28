import { Project } from "@/types";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/portfolio/ProjectCard";

interface FeaturedProjectsProps {
  projects: Project[];
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  if (projects.length === 0) {
    return (
      <section className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-10">
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
    <section className="container mx-auto px-4 py-24">
      <div className="flex items-center justify-between mb-10">
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
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}

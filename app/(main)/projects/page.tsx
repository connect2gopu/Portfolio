import { ProjectGrid } from "@/components/portfolio/ProjectGrid";
import { getAllProjects } from "@/lib/projects";

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Projects</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          A collection of my recent work, including web applications, open-source projects, and side projects.
        </p>
      </div>
      <ProjectGrid projects={projects} />
    </div>
  );
}


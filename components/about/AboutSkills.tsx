interface SkillCategory {
  name: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    name: "Frontend",
    skills: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "HTML5", "CSS3"],
  },
  {
    name: "Backend",
    skills: ["Node.js", "Express", "REST APIs", "GraphQL", "MongoDB", "PostgreSQL"],
  },
  {
    name: "Tools & Technologies",
    skills: ["Git", "Docker", "Vercel", "AWS", "CI/CD", "Webpack", "Jest"],
  },
  {
    name: "CMS & Content",
    skills: ["Tina CMS", "Contentful", "MDX", "Markdown"],
  },
];

export function AboutSkills() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Skills & Expertise</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {skillCategories.map((category) => (
          <div key={category.name} className="space-y-4">
            <h3 className="text-xl font-semibold text-primary">{category.name}</h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SkillCategory {
  name: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    name: "Languages",
    skills: [
  "Javascript",
  "Typescript",
  "C/C++",
  "Java",
  "Python",
  "SQL",
  "NoSQL"
],
  },
  {
    name: "Frontend",
    skills: [
  "React.js",
  "Next.js",
  "Redux",
  "React Native",
  "React Query",
  "TailwindCSS",
  "Figma",
  "HTML",
  "CSS"
],
  },
  {
    name: "Backend",
    skills: [
  "Node.js",
  "Express.js",
  "AWS",
  "Firebase",
  "RESTful APIs",
  "GraphQL"
],
  },
  {
    name: "Build, Tooling & DevOps",
    skills: [
  "Git",
  "Postman",
  "Jira",
  "Jest",
  "Webpack",
  "Babel",
  "Vite",
  "Docker",
  "Nginx"
],
  },
  {
    name: "Database",
    skills: [
  "MySQL",
  "MongoDB",
  "Redis"
],
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

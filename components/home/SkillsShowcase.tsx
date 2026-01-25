interface Skill {
  name: string;
  category: string;
}

const skills: Skill[] = [
  { name: "Javascript", category: "Languages" },
  { name: "Typescript", category: "Languages" },
  { name: "C/C++", category: "Languages" },
  { name: "Java", category: "Languages" },
  { name: "Python", category: "Languages" },
  { name: "SQL", category: "Languages" },
  { name: "NoSQL", category: "Languages" },
  { name: "React.js", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "Redux", category: "Frontend" },
  { name: "React Native", category: "Frontend" },
  { name: "React Query", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "Express.js", category: "Backend" },
  { name: "AWS", category: "Backend" },
  { name: "Firebase", category: "Backend" },
  { name: "Git", category: "Tools & DevOps" },
  { name: "Postman", category: "Tools & DevOps" },
  { name: "Jira", category: "Tools & DevOps" },
  { name: "Jest", category: "Tools & DevOps" },
  { name: "MySQL", category: "Database" },
  { name: "MongoDB", category: "Database" },
  { name: "Redis", category: "Database" },
];

const categories = ["Languages", "Frontend", "Backend", "Tools & DevOps", "Database"];

export function SkillsShowcase() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">Skills & Technologies</h2>
        <p className="text-muted-foreground">
          Technologies I work with to build amazing products
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {categories.map((category) => {
          const categorySkills = skills.filter((skill) => skill.category === category);
          return (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill) => (
                  <span
                    key={skill.name}
                    className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

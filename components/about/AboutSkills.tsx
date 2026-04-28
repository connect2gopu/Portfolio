import { skillCategories } from "@/data/resume";
import { skillIcons } from "@/components/home/SkillsShowcase";

export function AboutSkills() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Skills &amp; Expertise</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {skillCategories.map((category) => (
          <div key={category.name} className="space-y-4">
            <h3 className="text-xl font-semibold text-primary">{category.name}</h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => {
                const icon = skillIcons[skill];
                return (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-accent hover:text-accent-foreground hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                  >
                    {icon}
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

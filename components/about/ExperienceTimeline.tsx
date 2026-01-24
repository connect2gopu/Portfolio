interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  logo?: string;
}

const experiences: Experience[] = [
  {
    company: "Optimus AI Lab",
    role: "Mid-level Frontend Engineer",
    period: "Nov 25, 2024 - Jan 8, 2025",
    description: "At Optimus, my work involves developing and maintaining dynamic user-centric applications and interfaces for top organizations and government agencies.",
  },
  {
    company: "Paydestal",
    role: "Frontend Developer",
    period: "Sep 11, 2024 - Present",
    description: "At Paydestal, my primary roles involve collaborating with a cross-functional team to develop new fintech products and interactive dashboards using React.js, integrating APIs to display business data and transactions analytics, as well as optimizing existing applications to improve user experience and ensure product compliance.",
  },
  {
    company: "Educative",
    role: "Project Author",
    period: "Dec 5, 2023 - Sep 16, 2024",
    description: "Technical content author tasked with creating interactive real-world tutorials, focused on topics like Next.js, TypeScript, React.",
  },
  {
    company: "Freecodecamp",
    role: "Technical Writer",
    period: "Aug 25, 2022 - Dec 6, 2023",
    description: "Volunteer writer for freeCodeCamp, producing technical articles around topics like nextjs, react, and JavaScript.",
  },
];

export function ExperienceTimeline() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Work Experience</h2>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
        
        <div className="space-y-12">
          {experiences.map((exp, index) => (
            <div key={index} className="relative pl-12 md:pl-16">
              {/* Timeline dot */}
              <div className="absolute left-0 top-2 w-8 h-8 rounded-full bg-primary border-4 border-background hidden md:flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xl font-semibold">{exp.company}</h3>
                    <p className="text-primary font-medium">{exp.role}</p>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {exp.period}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { experiences as resumeExperiences } from "@/data/resume";

const groupedExperiences = resumeExperiences.map(exp => ({
  company: exp.company,
  period: exp.period,
  location: exp.location,
  roles: [
    { title: exp.position, descriptions: exp.descriptions },
    ...(exp.subRoles?.map(r => ({ title: r.title, descriptions: r.descriptions })) ?? []),
  ],
}));

export function ExperienceTimeline() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Work Experience</h2>
      <div className="relative">
        {/* Outer timeline spine */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

        <div className="space-y-14">
          {groupedExperiences.map((exp, index) => (
            <div key={index} className="relative pl-12 md:pl-16">
              {/* Company dot */}
              <div className="absolute left-0 top-2 w-8 h-8 rounded-full bg-primary border-4 border-background hidden md:flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>

              {/* Company header */}
              <div className="flex items-start justify-between flex-wrap gap-2 mb-6">
                <div>
                  <h3 className="text-xl font-bold">{exp.company}</h3>
                  {exp.location && (
                    <p className="text-sm text-muted-foreground mt-0.5">{exp.location}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap bg-secondary px-3 py-1 rounded-full border border-border">
                  {exp.period}
                </span>
              </div>

              {/* Roles */}
              {exp.roles.length > 1 ? (
                /* Grouped company: nested sub-timeline to show career progression */
                <div className="relative border-l-2 border-border/60 ml-1 pl-6 space-y-8">
                  {exp.roles.map((role, roleIndex) => (
                    <div key={roleIndex} className="relative">
                      {/* Role dot on the branch line */}
                      <div className="absolute -left-[1.9rem] top-1.5 w-3.5 h-3.5 rounded-full bg-background border-2 border-primary/70" />

                      <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
                        {role.title}
                      </h4>
                      <ul className="space-y-2 text-muted-foreground leading-relaxed ml-1">
                        {role.descriptions.map((desc, idx) => (
                          <li key={idx} className="flex gap-2 text-sm">
                            <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary/50" />
                            <span>{desc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                /* Single-role company */
                <div>
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
                    {exp.roles[0]?.title}
                  </h4>
                  <ul className="space-y-2 text-muted-foreground leading-relaxed">
                    {exp.roles[0]?.descriptions.map((desc, idx) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary/50" />
                        <span>{desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

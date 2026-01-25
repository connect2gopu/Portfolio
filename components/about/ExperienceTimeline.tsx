interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  logo?: string;
}

const experiences: Experience[] = [
  {
    company: "Info Edge India Ltd - 99acres",
    role: "Team Lead (Software Engineering)",
    period: "July 2019 - Present",
    description: "Directed a cross-functional team to deliver high-impact product features, enhancing platform competitiveness and improving user satisfaction (4.3/5 on play store). Developed a page speed monitoring tool, reduced LCP, CLS & INP from 400ms to 180ms and improved other Core Web Vitals. Devised and implemented adaptive widget positioning, increasing ad visibility and driving 20% higher click-through rates. Improved platform response times by implementing intelligent CDN-backed Edge caching, resulting in 1.5x improvement in SEO crawl budget utilization. Optimized app load time by 40% by re-architecting API call flow and introducing component-level lazy loading.",
  },
  {
    company: "Info Edge India Ltd - 99acres",
    role: "Lead Engineer",
    period: "Previous Role",
    description: "Conceptualized and delivered video features (Shorts and Stories), resulting in a 25% increase in user engagement. Built configurable search and filter options, increasing A/B testing efficiency. Championed the transition to a Microfrontend architecture, reducing cross-team dependencies and achieving 2X faster feature rollouts. Overhauled search result tuples, boosting user experience and driving a 15% increase in CTA's CTR.",
  },
  {
    company: "Info Edge India Ltd - 99acres",
    role: "Senior Software Engineer",
    period: "Previous Role",
    description: "Proposed and executed self-hosted key functionalities for cross-site use, reducing development cycle time by 30% and ensuring UI/UX consistency. Enhanced no-index URL quality, improving SEO budget efficiency by 30% and boosting crawl performance.",
  },
  {
    company: "So City",
    role: "Software Engineer",
    period: "May 2018 - June 2019",
    description: "Engineered an in-house web-based tool, driving a 40% increase in postings via the internal platform by streamlining workflows. Automated database backup and restore processes, significantly enhancing data reliability. Designed and developed internal APIs to support content creation and publishing workflows, enabling efficient and reliable content posting across the site.",
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

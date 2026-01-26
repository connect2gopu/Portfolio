// Auto-generated from out.md - Do not edit manually
// Run: npm run parse-resume

export interface PersonalInfo {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  leetcode: string;
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface Experience {
  company: string;
  position: string;
  location: string;
  period: string;
  descriptions: string[];
  subRoles?: {
    title: string;
    descriptions: string[];
  }[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  grade?: string;
  location: string;
  period: string;
}

export const personalInfo: PersonalInfo = {
  "name": "Gopal sharma",
  "phone": "+919069367364",
  "email": "connect2gopu@gmail.com",
  "linkedin": "whogopu",
  "github": "whogopu",
  "leetcode": "whogopu/"
};

export const skillCategories: SkillCategory[] = [
  {
    name: "Languages",
    skills: ["Javascript","Typescript","C/C++","Java","Python","SQL","NoSQL"],
  },
  {
    name: "Frontend",
    skills: ["React.js","Next.js","Redux","React Native","React Query","TailwindCSS","Figma","HTML","CSS"],
  },
  {
    name: "Backend",
    skills: ["Node.js","Express.js","AWS","Firebase","RESTful APIs","GraphQL"],
  },
  {
    name: "Build, Tooling & DevOps",
    skills: ["Git","Postman","Jira","Jest","Webpack","Babel","Vite","Docker","Nginx"],
  },
  {
    name: "Database",
    skills: ["MySQL","MongoDB","Redis"],
  },
];

export const experiences: Experience[] = [
  {
    "company": "Info Edge India Ltd - 99acres",
    "position": "Team Lead (Software Engineering)",
    "location": "Noida, Uttar Pradesh",
    "period": "July 2019 - Present",
    "descriptions": [
      "Directed a cross-functional team to deliver high-impact product features, enhancing platform competitiveness and improving user satisfaction (4.3/5 on play store).",
      "Developed a page speed monitoring tool, reduced LCP, CLS & INP from 400 ms to 180 ms and improved other Core Web Vitals, leading to enhanced user retention.",
      "Devised and implemented adaptive widget positioning, increasing ad visibility and driving 20% higher click-through rates on promoted content.",
      "Improved platform response times by implementing intelligent CDN-backed Edge caching for key pages, resulting in 1.5× improvement in SEO crawl budget utilization.",
      "Introduced event tracking across the application, resulting in actionable insights that boosted feature adoption by 30%.",
      "Optimized app load time by 40% by re-architecting API call flow, enabling backend-for-frontend pattern deferring non-critical data, and introducing component-level lazy loading and pagination improvements.",
      "Enhanced system availability to 99.9% up-time by anticipating critical issues and leveraging KPIs for monitoring."
    ],
    "subRoles": [
      {
        "title": "Lead Engineer",
        "descriptions": [
          "Conceptualized and delivered video features (Shorts and Stories), resulting in a 25% increase in user engagement and time spent on the platform.",
          "Built configurable search and filter options, increasing A/B testing efficiency and driving improvement in data-driven decision-making.",
          "Championed the transition to a Microfrontend architecture, reducing cross-team dependencies, enabling modular development, and achieving 2X faster feature rollouts.",
          "Overhauled search result tuples, boosting user experience and driving a 15% increase in CTA's CTR."
        ]
      },
      {
        "title": "Senior Software Engineer",
        "descriptions": [
          "Proposed and executed a self-hosted key functionalities for cross-site use, reducing development cycle time by 30% and ensuring UI/UX consistency.",
          "Enhanced no-index URL quality, improving SEO budget efficiency by 30% and boosting crawl performance."
        ]
      }
    ]
  },
  {
    "company": "So City",
    "position": "Software Engineer",
    "location": "Delhi",
    "period": "May 2018 - Jun 2019",
    "descriptions": [
      "Engineered an in-house web-based tool, driving a 40% increase in postings via the internal platform by streamlining workflows.",
      "Automated database backup and restore processes, significantly enhancing data reliability.",
      "Designed and developed internal APIs to support content creation and publishing workflows for the platform, enabling efficient and reliable content posting across the site."
    ]
  }
];

export const education: EducationEntry[] = [
  {
    "institution": "Guru Gobind Singh Indraprastha University",
    "degree": "Guru Gobind Singh Indraprastha University",
    "location": "",
    "period": "Jul 2014 - May 2018"
  }
];

// Helper: Get all skills as flat array for SkillsShowcase
export const allSkills = skillCategories.flatMap(cat => 
  cat.skills.map(skill => ({ name: skill, category: cat.name }))
);

// Helper: Get social links
export const socialLinks = [
  {
    name: "GitHub",
    href: `https://github.com/${personalInfo.github}`,
  },
  {
    name: "LinkedIn",
    href: `https://linkedin.com/in/${personalInfo.linkedin}`,
  },
  {
    name: "LeetCode",
    href: `https://leetcode.com/u/${personalInfo.leetcode}`,
  },
  {
    name: "Email",
    href: `mailto:${personalInfo.email}`,
  },
];

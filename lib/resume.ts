import { ResumeData } from "@/types";
import fs from "fs";
import path from "path";

/**
 * Resume Data Loader
 * 
 * Loads parsed resume data from the generated JSON file.
 * Falls back to default data if file doesn't exist.
 */

const RESUME_DATA_PATH = path.join(process.cwd(), "lib", "resume-data.json");

// Default fallback data (current hardcoded values)
const defaultResumeData: ResumeData = {
  personalInfo: {
    name: "Gopal Sharma",
    title: "Team Lead (Software Engineering) & Full-Stack Developer",
    email: "connect2gopu@gmail.com",
    phone: "+91-9069367364",
    summary:
      "A passionate software engineer with 7+ years of experience building scalable web applications, leading cross-functional teams, and delivering high-impact product features that enhance user experience and drive business growth.",
    yearsOfExperience: "7",
  },
  experiences: [
    {
      company: "Info Edge India Ltd - 99acres",
      role: "Team Lead (Software Engineering)",
      period: "July 2019 - Present",
      description:
        "Directed a cross-functional team to deliver high-impact product features, enhancing platform competitiveness and improving user satisfaction (4.3/5 on play store). Developed a page speed monitoring tool, reduced LCP, CLS & INP from 400ms to 180ms and improved other Core Web Vitals. Devised and implemented adaptive widget positioning, increasing ad visibility and driving 20% higher click-through rates. Improved platform response times by implementing intelligent CDN-backed Edge caching, resulting in 1.5x improvement in SEO crawl budget utilization. Optimized app load time by 40% by re-architecting API call flow and introducing component-level lazy loading.",
    },
    {
      company: "Info Edge India Ltd - 99acres",
      role: "Lead Engineer",
      period: "Previous Role",
      description:
        "Conceptualized and delivered video features (Shorts and Stories), resulting in a 25% increase in user engagement. Built configurable search and filter options, increasing A/B testing efficiency. Championed the transition to a Microfrontend architecture, reducing cross-team dependencies and achieving 2X faster feature rollouts. Overhauled search result tuples, boosting user experience and driving a 15% increase in CTA's CTR.",
    },
    {
      company: "Info Edge India Ltd - 99acres",
      role: "Senior Software Engineer",
      period: "Previous Role",
      description:
        "Proposed and executed self-hosted key functionalities for cross-site use, reducing development cycle time by 30% and ensuring UI/UX consistency. Enhanced no-index URL quality, improving SEO budget efficiency by 30% and boosting crawl performance.",
    },
    {
      company: "So City",
      role: "Software Engineer",
      period: "May 2018 - June 2019",
      description:
        "Engineered an in-house web-based tool, driving a 40% increase in postings via the internal platform by streamlining workflows. Automated database backup and restore processes, significantly enhancing data reliability. Designed and developed internal APIs to support content creation and publishing workflows, enabling efficient and reliable content posting across the site.",
    },
  ],
  education: [
    {
      degree: "Bachelor of Technology",
      institution: "Guru Gobind Singh Indraprastha University",
      grade: "71%",
      period: "July 2014 - May 2018",
      location: "Delhi, India",
    },
  ],
  skills: [
    {
      category: "Languages",
      skills: [
        "JavaScript",
        "TypeScript",
        "C/C++",
        "Java",
        "Python",
        "SQL",
        "NoSQL",
      ],
    },
    {
      category: "Frontend",
      skills: [
        "React.js",
        "Next.js",
        "Redux",
        "React Native",
        "React Query",
        "TailwindCSS",
        "Figma",
        "HTML",
        "CSS",
      ],
    },
    {
      category: "Backend",
      skills: [
        "Node.js",
        "Express.js",
        "AWS",
        "Firebase",
        "RESTful APIs",
        "GraphQL",
      ],
    },
    {
      category: "Build, Tooling & DevOps",
      skills: [
        "Git",
        "Postman",
        "Jira",
        "Jest",
        "Webpack",
        "Babel",
        "Vite",
        "Docker",
        "Nginx",
      ],
    },
    {
      category: "Database",
      skills: ["MySQL", "MongoDB", "Redis"],
    },
  ],
};

/**
 * Loads resume data from the generated JSON file
 */
export function getResumeData(): ResumeData {
  try {
    if (fs.existsSync(RESUME_DATA_PATH)) {
      const fileContent = fs.readFileSync(RESUME_DATA_PATH, "utf-8");
      const data = JSON.parse(fileContent) as ResumeData;
      
      // Validate that we have at least basic data
      if (data.personalInfo && data.personalInfo.name) {
        return data;
      }
    }
  } catch (error) {
    console.warn("Failed to load resume data, using defaults:", error);
  }

  // Fall back to default data
  return defaultResumeData;
}

/**
 * Gets personal information from resume
 */
export function getPersonalInfo() {
  return getResumeData().personalInfo;
}

/**
 * Gets work experiences from resume
 */
export function getExperiences() {
  return getResumeData().experiences;
}

/**
 * Gets education from resume
 */
export function getEducation() {
  return getResumeData().education;
}

/**
 * Gets skills from resume
 */
export function getSkills() {
  return getResumeData().skills;
}

import fs from "fs";
import path from "path";

interface ResumeData {
  name: string;
  title: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  leetcode: string;
  skills: {
    languages: string[];
    frontend: string[];
    backend: string[];
    buildToolingDevops: string[];
    database: string[];
  };
  experience: Array<{
    company: string;
    role: string;
    period: string;
    location?: string;
    description: string;
  }>;
  education: {
    institution: string;
    degree: string;
    grade: string;
    period: string;
    location: string;
  };
}

function cleanLatexText(text: string): string {
  return text
    .replace(/\\textbf\{([^}]+)\}/g, "$1")
    .replace(/\\normalsize/g, "")
    .replace(/\\underline\{([^}]+)\}/g, "$1")
    .replace(/\\href\{[^}]+\}\{([^}]+)\}/g, "$1")
    .replace(/\\raisebox\{[^}]+\}/g, "")
    .replace(/\\fa[A-Za-z]+/g, "")
    .replace(/\{|\}/g, "")
    .replace(/\\/g, "")
    .trim();
}

function parseResumeTex(texContent: string): ResumeData {
  // Extract name (fixing typo "Gopal1" to "Gopal")
  const nameMatch = texContent.match(/\\Huge.*?\\scshape\s+([^\\}]+)/);
  let name = nameMatch ? nameMatch[1].trim() : "Gopal Sharma";
  name = name.replace(/Gopal1/, "Gopal").trim();
  // Capitalize properly
  name = name.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");

  // Extract contact info
  const phoneMatch = texContent.match(/tel:(\+?[\d-]+)/);
  const phone = phoneMatch ? phoneMatch[1] : "+91-9069367364";

  const emailMatch = texContent.match(/mailto:([^\s\\}]+)/);
  const email = emailMatch ? emailMatch[1] : "connect2gopu@gmail.com";

  const linkedinMatch = texContent.match(/linkedin\.com\/in\/([^\s\\}]+)/);
  const linkedin = linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : "https://linkedin.com/in/whogopu";

  // Extract GitHub - look for the actual github link, not template links
  const githubMatches = texContent.matchAll(/github\.com\/([^\s\\}]+)/g);
  let github = "https://github.com/whogopu";
  for (const match of githubMatches) {
    if (match[1] && !match[1].includes("sb2nov") && !match[1].includes("resume")) {
      github = `https://github.com/${match[1]}`;
      break;
    }
  }

  const leetcodeMatch = texContent.match(/leetcode\.com\/u\/([^\s\\}]+)/);
  const leetcode = leetcodeMatch ? `https://leetcode.com/u/${leetcodeMatch[1]}` : "https://leetcode.com/whogopu";

  // Extract skills - more flexible regex
  const languagesMatch = texContent.match(/Languages:.*?normalsize:([^}]+)\}/);
  const languages = languagesMatch && languagesMatch[1]
    ? languagesMatch[1]
        .split(",")
        .map((s) => cleanLatexText(s))
        .filter(Boolean)
    : ["Javascript", "Typescript", "C/C++", "Java", "Python", "SQL", "NoSQL"];

  const frontendMatch = texContent.match(/Frontend:.*?normalsize:([^}]+)\}/);
  const frontend = frontendMatch && frontendMatch[1]
    ? frontendMatch[1]
        .split(",")
        .map((s) => cleanLatexText(s))
        .filter(Boolean)
    : ["React.js", "Next.js", "Redux", "React Native", "React Query", "TailwindCSS", "Figma", "HTML", "CSS"];

  const backendMatch = texContent.match(/Backend:.*?normalsize:([^}]+)\}/);
  const backend = backendMatch && backendMatch[1]
    ? backendMatch[1]
        .split(",")
        .map((s) => cleanLatexText(s))
        .filter(Boolean)
    : ["Node.js", "Express.js", "AWS", "Firebase", "RESTful APIs", "GraphQL"];

  const buildToolingMatch = texContent.match(/Build, Tooling.*?DevOps:.*?normalsize:([^}]+)\}/);
  const buildToolingDevops = buildToolingMatch && buildToolingMatch[1]
    ? buildToolingMatch[1]
        .split(",")
        .map((s) => cleanLatexText(s))
        .filter(Boolean)
    : ["Git", "Postman", "Jira", "Jest", "Webpack", "Babel", "Vite", "Docker", "Nginx"];

  const databaseMatch = texContent.match(/Database:.*?normalsize:\s*([^}]+)\}/);
  const database = databaseMatch && databaseMatch[1]
    ? databaseMatch[1]
        .split(",")
        .map((s) => cleanLatexText(s))
        .filter(Boolean)
    : ["MySQL", "MongoDB", "Redis"];

  // Extract experience - more robust parsing with multiline support
  const experience: ResumeData["experience"] = [];

  // Info Edge - Team Lead (look for the role after the company heading)
  const infoEdgeSection = texContent.match(/Info Edge India Ltd - 99acres.*?Team Lead \(Software Engineering\).*?resumeItemListStart([\s\S]*?)resumeItemListEnd/);
  if (infoEdgeSection && infoEdgeSection[1]) {
    // Extract all resumeItem entries, handling multiline content
    const items = infoEdgeSection[1].match(/\\resumeItem\{[^}]*normalsize:\{([^}]+(?:\}[^}]*\{[^}]+)*)\}/g) || [];
    const descriptions = items.map((item) => {
      // Handle nested braces and multiline
      let content = item;
      // Extract the content between normalsize:{ and the matching }
      const match = content.match(/normalsize:\{((?:[^{}]|\{[^}]*\})*)\}/);
      if (match) {
        return cleanLatexText(match[1].replace(/\n/g, " "));
      }
      return "";
    }).filter(Boolean);
    
    if (descriptions.length > 0) {
      experience.push({
        company: "Info Edge India Ltd - 99acres",
        role: "Team Lead (Software Engineering)",
        period: "July 2019 - Present",
        location: "Noida, Uttar Pradesh",
        description: descriptions.join(" "),
      });
    }
  }

  // Info Edge - Lead Engineer
  const leadEngineerMatch = texContent.match(/Lead Engineer.*?resumeItemListStart([\s\S]*?)resumeItemListEnd/);
  if (leadEngineerMatch && leadEngineerMatch[1]) {
    const items = leadEngineerMatch[1].match(/\\resumeItem\{[^}]*normalsize:\{([^}]+(?:\}[^}]*\{[^}]+)*)\}/g) || [];
    const descriptions = items.map((item) => {
      const match = item.match(/normalsize:\{((?:[^{}]|\{[^}]*\})*)\}/);
      return match ? cleanLatexText(match[1].replace(/\n/g, " ")) : "";
    }).filter(Boolean);
    
    if (descriptions.length > 0) {
      experience.push({
        company: "Info Edge India Ltd - 99acres",
        role: "Lead Engineer",
        period: "Previous Role",
        location: "Noida, Uttar Pradesh",
        description: descriptions.join(" "),
      });
    }
  }

  // Info Edge - Senior Software Engineer
  const seniorMatch = texContent.match(/Senior Software Engineer.*?resumeItemListStart([\s\S]*?)resumeItemListEnd/);
  if (seniorMatch && seniorMatch[1]) {
    const items = seniorMatch[1].match(/\\resumeItem\{[^}]*normalsize:\{([^}]+(?:\}[^}]*\{[^}]+)*)\}/g) || [];
    const descriptions = items.map((item) => {
      const match = item.match(/normalsize:\{((?:[^{}]|\{[^}]*\})*)\}/);
      return match ? cleanLatexText(match[1].replace(/\n/g, " ")) : "";
    }).filter(Boolean);
    
    if (descriptions.length > 0) {
      experience.push({
        company: "Info Edge India Ltd - 99acres",
        role: "Senior Software Engineer",
        period: "Previous Role",
        location: "Noida, Uttar Pradesh",
        description: descriptions.join(" "),
      });
    }
  }

  // So City
  const soCityMatch = texContent.match(/So City.*?\{([^}]+)\}\s*\{([^}]+)\}.*?\{([^}]+)\}\s*\{([^}]+)\}.*?resumeItemListStart(.*?)resumeItemListEnd/gs);
  if (soCityMatch && soCityMatch[5]) {
    const items = soCityMatch[5].match(/\\resumeItem\{[^}]*normalsize:\{([^}]+)\}/g) || [];
    const descriptions = items.map((item) => {
      const match = item.match(/normalsize:\{([^}]+)\}/);
      return match ? cleanLatexText(match[1]) : "";
    }).filter(Boolean);

    experience.push({
      company: "So City",
      role: "Software Engineer",
      period: soCityMatch[2] || "May 2018 - June 2019",
      location: soCityMatch[4] || "Delhi",
      description: descriptions.join(" "),
    });
  }

  // Extract education
  const educationMatch = texContent.match(/Guru Gobind Singh Indraprastha University.*?\{([^}]+)\}\s*\{([^}]+)\}.*?\{([^}]+)\}\s*\{([^}]+)\}/s);
  let education = {
    institution: "Guru Gobind Singh Indraprastha University",
    degree: "Bachelor of Technology",
    grade: "71%",
    period: "Jul 2014 -- May 2018",
    location: "Delhi, India",
  };

  if (educationMatch && educationMatch[3]) {
    const degreeMatch = educationMatch[3].match(/Bachelor of Technology[^}]*/);
    const gradeMatch = educationMatch[3].match(/\d+%/);
    education = {
      institution: "Guru Gobind Singh Indraprastha University",
      degree: degreeMatch ? cleanLatexText(degreeMatch[0]) : "Bachelor of Technology",
      grade: gradeMatch ? gradeMatch[0] : "71%",
      period: educationMatch[2] || "Jul 2014 -- May 2018",
      location: educationMatch[4] || "Delhi, India",
    };
  }

  return {
    name,
    title: "Team Lead (Software Engineering) & Full-Stack Developer",
    phone,
    email,
    linkedin,
    github,
    leetcode,
    skills: {
      languages,
      frontend,
      backend,
      buildToolingDevops,
      database,
    },
    experience,
    education,
  };
}

function updateComponents(resumeData: ResumeData) {
  const rootDir = path.join(process.cwd());

  // Update Hero component
  const heroPath = path.join(rootDir, "components/home/Hero.tsx");
  let heroContent = fs.readFileSync(heroPath, "utf-8");

  heroContent = heroContent.replace(
    /Team Lead \(Software Engineering\) & Full-Stack Developer/g,
    resumeData.title
  );
  heroContent = heroContent.replace(
    /I&apos;m Gopal Sharma, a passionate software engineer with 7\+ years/g,
    `I&apos;m ${resumeData.name}, a passionate software engineer with 7+ years`
  );

  fs.writeFileSync(heroPath, heroContent);

  // Update Experience Timeline
  const experiencePath = path.join(rootDir, "components/about/ExperienceTimeline.tsx");
  let experienceContent = `interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  logo?: string;
}

const experiences: Experience[] = [
`;

  resumeData.experience.forEach((exp) => {
    experienceContent += `  {
    company: ${JSON.stringify(exp.company)},
    role: ${JSON.stringify(exp.role)},
    period: ${JSON.stringify(exp.period)},
    description: ${JSON.stringify(exp.description)},
  },
`;
  });

  experienceContent += `];

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
`;

  fs.writeFileSync(experiencePath, experienceContent);

  // Update Skills
  const skillsPath = path.join(rootDir, "components/about/AboutSkills.tsx");
  const skillsContent = `interface SkillCategory {
  name: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    name: "Languages",
    skills: ${JSON.stringify(resumeData.skills.languages, null, 2)},
  },
  {
    name: "Frontend",
    skills: ${JSON.stringify(resumeData.skills.frontend, null, 2)},
  },
  {
    name: "Backend",
    skills: ${JSON.stringify(resumeData.skills.backend, null, 2)},
  },
  {
    name: "Build, Tooling & DevOps",
    skills: ${JSON.stringify(resumeData.skills.buildToolingDevops, null, 2)},
  },
  {
    name: "Database",
    skills: ${JSON.stringify(resumeData.skills.database, null, 2)},
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
`;

  fs.writeFileSync(skillsPath, skillsContent);

  // Update Home Skills Showcase
  const homeSkillsPath = path.join(rootDir, "components/home/SkillsShowcase.tsx");
  const homeSkillsContent = `interface Skill {
  name: string;
  category: string;
}

const skills: Skill[] = [
${resumeData.skills.languages.map((s) => `  { name: ${JSON.stringify(s)}, category: "Languages" },`).join("\n")}
${resumeData.skills.frontend.slice(0, 5).map((s) => `  { name: ${JSON.stringify(s)}, category: "Frontend" },`).join("\n")}
${resumeData.skills.backend.slice(0, 4).map((s) => `  { name: ${JSON.stringify(s)}, category: "Backend" },`).join("\n")}
${resumeData.skills.buildToolingDevops.slice(0, 4).map((s) => `  { name: ${JSON.stringify(s)}, category: "Tools & DevOps" },`).join("\n")}
${resumeData.skills.database.map((s) => `  { name: ${JSON.stringify(s)}, category: "Database" },`).join("\n")}
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
`;

  fs.writeFileSync(homeSkillsPath, homeSkillsContent);

  // Update About page
  const aboutPagePath = path.join(rootDir, "app/(main)/about/page.tsx");
  let aboutPageContent = fs.readFileSync(aboutPagePath, "utf-8");

  aboutPageContent = aboutPageContent.replace(
    /Gopal Sharma/g,
    resumeData.name
  );
  aboutPageContent = aboutPageContent.replace(
    /Team Lead \(Software Engineering\) & Full-Stack Developer/g,
    resumeData.title
  );
  aboutPageContent = aboutPageContent.replace(
    /connect2gopu@gmail.com/g,
    resumeData.email
  );
  aboutPageContent = aboutPageContent.replace(
    /\+91-9069367364/g,
    resumeData.phone
  );
  
  // Update avatar initials
  const initials = resumeData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  aboutPageContent = aboutPageContent.replace(
    /text-primary">GS</g,
    `text-primary">${initials}</g`
  );

  fs.writeFileSync(aboutPagePath, aboutPageContent);

  // Update Education component
  const educationPath = path.join(rootDir, "components/about/Education.tsx");
  const educationContent = `export function Education() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Education</h2>
      <div className="space-y-6">
        <div className="border-l-4 border-primary pl-6">
          <h3 className="text-xl font-semibold mb-2">
            ${resumeData.education.degree}
          </h3>
          <p className="text-lg text-primary font-medium mb-2">
            ${resumeData.education.institution}
          </p>
          <p className="text-muted-foreground mb-2">
            Grade: ${resumeData.education.grade}
          </p>
          <p className="text-sm text-muted-foreground">
            ${resumeData.education.period} | ${resumeData.education.location}
          </p>
        </div>
      </div>
    </div>
  );
}
`;

  fs.writeFileSync(educationPath, educationContent);

  // Update Social Links
  const socialLinksPath = path.join(rootDir, "components/about/SocialLinks.tsx");
  let socialLinksContent = fs.readFileSync(socialLinksPath, "utf-8");

  socialLinksContent = socialLinksContent.replace(
    /https:\/\/github\.com\/[^\s"']+/g,
    resumeData.github
  );
  socialLinksContent = socialLinksContent.replace(
    /https:\/\/linkedin\.com\/in\/[^\s"']+/g,
    resumeData.linkedin
  );
  socialLinksContent = socialLinksContent.replace(
    /https:\/\/leetcode\.com\/[^\s"']+/g,
    resumeData.leetcode
  );
  socialLinksContent = socialLinksContent.replace(
    /mailto:[^\s"']+/g,
    `mailto:${resumeData.email}`
  );

  fs.writeFileSync(socialLinksPath, socialLinksContent);

  // Update Header
  const headerPath = path.join(rootDir, "components/layout/Header.tsx");
  let headerContent = fs.readFileSync(headerPath, "utf-8");
  headerContent = headerContent.replace(/Gopal Sharma/g, resumeData.name);
  fs.writeFileSync(headerPath, headerContent);

  // Update Footer
  const footerPath = path.join(rootDir, "components/layout/Footer.tsx");
  let footerContent = fs.readFileSync(footerPath, "utf-8");
  footerContent = footerContent.replace(/Gopal Sharma/g, resumeData.name);
  footerContent = footerContent.replace(
    /https:\/\/github\.com\/[^\s"']+/g,
    resumeData.github
  );
  footerContent = footerContent.replace(
    /https:\/\/linkedin\.com\/in\/[^\s"']+/g,
    resumeData.linkedin
  );
  footerContent = footerContent.replace(
    /https:\/\/leetcode\.com\/[^\s"']+/g,
    resumeData.leetcode
  );
  fs.writeFileSync(footerPath, footerContent);

  // Update Contact page
  const contactPath = path.join(rootDir, "app/(main)/contact/page.tsx");
  let contactContent = fs.readFileSync(contactPath, "utf-8");
  contactContent = contactContent.replace(
    /mailto:[^\s"']+@[^\s"']+/g,
    `mailto:${resumeData.email}`
  );
  contactContent = contactContent.replace(
    /[^\s"']+@[^\s"']+\.com/g,
    resumeData.email
  );
  contactContent = contactContent.replace(
    /https:\/\/github\.com\/[^\s"']+/g,
    resumeData.github
  );
  contactContent = contactContent.replace(
    /https:\/\/linkedin\.com\/in\/[^\s"']+/g,
    resumeData.linkedin
  );
  contactContent = contactContent.replace(
    /https:\/\/leetcode\.com\/[^\s"']+/g,
    resumeData.leetcode
  );
  fs.writeFileSync(contactPath, contactContent);

  console.log("✅ Resume parsed and components updated successfully!");
  console.log(`📝 Name: ${resumeData.name}`);
  console.log(`💼 Title: ${resumeData.title}`);
  console.log(`📧 Email: ${resumeData.email}`);
  console.log(`📱 Phone: ${resumeData.phone}`);
  console.log(`🔗 LinkedIn: ${resumeData.linkedin}`);
  console.log(`💻 GitHub: ${resumeData.github}`);
  console.log(`📊 LeetCode: ${resumeData.leetcode}`);
  console.log(`🎓 Education: ${resumeData.education.institution}`);
  console.log(`💼 Experience entries: ${resumeData.experience.length}`);
}

// Main execution
const resumeTexPath = path.join(process.cwd(), "public/resume/resume.tex");

if (!fs.existsSync(resumeTexPath)) {
  console.error(`❌ Resume file not found at: ${resumeTexPath}`);
  process.exit(1);
}

try {
  const texContent = fs.readFileSync(resumeTexPath, "utf-8");
  const resumeData = parseResumeTex(texContent);
  updateComponents(resumeData);
  console.log("\n✨ All done! Your portfolio has been updated with resume data.");
} catch (error) {
  console.error("❌ Error parsing resume:", error);
  process.exit(1);
}

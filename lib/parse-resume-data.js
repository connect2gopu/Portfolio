// Parse out.md and generate resume data file
const fs = require('fs');
const { resolve } = require('path');

const markdownPath = resolve(__dirname, '../public/resume/out.md');
const outputPath = resolve(__dirname, '../data/resume.ts');

// Read markdown file
const markdown = fs.readFileSync(markdownPath, 'utf-8');

// Extract personal info
function extractPersonalInfo(md) {
  const personalInfo = {
    name: '',
    phone: '',
    email: '',
    linkedin: '',
    github: '',
    leetcode: '',
  };

  // Extract name (first line in center block)
  const nameMatch = md.match(/\[([^\]]+)\]\{\.smallcaps\}/);
  if (nameMatch) {
    personalInfo.name = nameMatch[1].trim();
  }

  // Extract phone - pattern: [  [+91-9069367364]{.underline}  ](tel:+919069367364)
  const phoneMatch = md.match(/\[[^\]]*\[([^\]]+)\]\{\.underline\}[^\]]*\]\(tel:([^)]+)\)/);
  if (phoneMatch) {
    personalInfo.phone = phoneMatch[2];
  }

  // Extract email
  const emailMatch = md.match(/\[([^\]]+)\]\{\.underline\}\]\(mailto:([^)]+)\)/);
  if (emailMatch) {
    personalInfo.email = emailMatch[2];
  }

  // Extract LinkedIn - pattern: [linkedin/whogopu]{.underline}](https://linkedin.com/in/whogopu)
  const linkedinMatch = md.match(/\[linkedin\/([^\]]+)\]\{\.underline\}\]\(https?:\/\/[^)]*linkedin\.com\/in\/([^)]+)\)/);
  if (linkedinMatch) {
    personalInfo.linkedin = linkedinMatch[2] || linkedinMatch[1];
  }

  // Extract GitHub
  const githubMatch = md.match(/\[github\/([^\]]+)\]\{\.underline\}\]\(https?:\/\/[^)]*github\.com\/([^)]+)\)/);
  if (githubMatch) {
    personalInfo.github = githubMatch[2] || githubMatch[1];
  }

  // Extract LeetCode
  const leetcodeMatch = md.match(/\[leetcode\/([^\]]+)\]\{\.underline\}\]\(https?:\/\/[^)]*leetcode\.com\/u\/([^)]+)\)/);
  if (leetcodeMatch) {
    personalInfo.leetcode = leetcodeMatch[2] || leetcodeMatch[1];
  }

  return personalInfo;
}

// Extract skills
function extractSkills(md) {
  const skills = {
    languages: [],
    frontend: [],
    backend: [],
    buildTools: [],
    database: [],
  };

  // Extract Languages
  const languagesMatch = md.match(/\*\*Languages:\*\*\s*([^\n\\]+)/);
  if (languagesMatch) {
    skills.languages = languagesMatch[1]
      .split(',')
      .map(s => s.trim().replace(/[.\\]+$/, ''))
      .filter(s => s.length > 0);
  }

  // Extract Frontend
  const frontendMatch = md.match(/\*\*Frontend:\*\*\s*([^\n\\]+)/);
  if (frontendMatch) {
    skills.frontend = frontendMatch[1]
      .split(',')
      .map(s => s.trim().replace(/[.\\]+$/, ''))
      .filter(s => s.length > 0);
  }

  // Extract Backend
  const backendMatch = md.match(/\*\*Backend:\*\*\s*([^\n\\]+)/);
  if (backendMatch) {
    skills.backend = backendMatch[1]
      .split(',')
      .map(s => s.trim().replace(/[.\\]+$/, ''))
      .filter(s => s.length > 0);
  }

  // Extract Build, Tooling & DevOps
  const buildMatch = md.match(/\*\*Build[^:]*:\*\*\s*([^\n\\]+)/);
  if (buildMatch) {
    skills.buildTools = buildMatch[1]
      .split(',')
      .map(s => s.trim().replace(/[.\\]+$/, ''))
      .filter(s => s.length > 0);
  }

  // Extract Database
  const databaseMatch = md.match(/\*\*Database:\*\*\s*([^\n\\]+)/);
  if (databaseMatch) {
    skills.database = databaseMatch[1]
      .split(',')
      .map(s => s.trim().replace(/[.\\]+$/, ''))
      .filter(s => s.length > 0);
  }

  return skills;
}

// Extract work experience
function extractExperience(md) {
  const experiences = [];

  // Find EXPERIENCE section
  const experienceSection = md.match(/# EXPERIENCE\s*([\s\S]*?)(?=# EDUCATION|$)/);
  if (!experienceSection) {
    return experiences;
  }

  const expText = experienceSection[1];

  // Split by company entries (look for company name in bold followed by date)
  // Pattern: **Company** **Date** on separate lines
  const entries = expText.split(/(?=\*\*[^*]+\*\*\s+\*\*[^*]+\*\*)/);

  for (const entry of entries) {
    if (!entry.trim() || entry.trim().startsWith('-')) continue;

    // Extract company and date
    const companyDateMatch = entry.match(/\*\*([^*]+)\*\*\s+\*\*([^*]+)\*\*/);
    if (!companyDateMatch) continue;

    const company = companyDateMatch[1].trim();
    const dateRange = companyDateMatch[2].trim();

    // Extract position and location (italic text)
    const positionLocationMatch = entry.match(/\*\[([^\]]+)\]\{\.underline\}\*\s+\*([^*]+)\*/);
    const position = positionLocationMatch ? positionLocationMatch[1].trim() : '';
    const location = positionLocationMatch ? positionLocationMatch[2].trim() : '';

    if (!position) continue;

    // Find all sub-roles first (italic text with underline)
    const subRoleRegex = /\*\[([^\]]+)\]\{\.underline\}\*/g;
    const allRoleMatches = [];
    let roleMatch;
    
    while ((roleMatch = subRoleRegex.exec(entry)) !== null) {
      allRoleMatches.push({
        title: roleMatch[1].trim(),
        index: roleMatch.index,
      });
    }

    // The first role match should be the main position
    const mainRoleIndex = allRoleMatches.length > 0 && allRoleMatches[0].title === position 
      ? allRoleMatches[0].index 
      : -1;

    // Extract descriptions for main role (all bullets before first sub-role or end)
    const mainRoleEnd = allRoleMatches.length > 1 ? allRoleMatches[1].index : entry.length;
    const mainRoleContent = mainRoleIndex >= 0 
      ? entry.substring(mainRoleIndex, mainRoleEnd)
      : entry.substring(0, mainRoleEnd);

    const descriptions = [];
    // Match all bullet points: -  **text** more text (note: bullets are indented with 2 spaces)
    // Pattern: "  -  " (2 spaces, dash, 2 spaces) or "-  " at start of line
    const mainBullets = mainRoleContent.match(/^  -  [^\n]+/gm) || mainRoleContent.match(/^-  [^\n]+/gm);
    if (mainBullets) {
      descriptions.push(...mainBullets.map(bullet => {
        // Remove leading spaces and dash, clean up bold markers
        return bullet.replace(/^[\s-]+/, '').replace(/\*\*/g, '').trim();
      }));
    }

    // Extract sub-roles (skip the first one if it's the main position)
    const subRoles = [];
    const subRoleMatches = allRoleMatches.filter((role, idx) => 
      idx > 0 || role.title !== position
    );

    for (let i = 0; i < subRoleMatches.length; i++) {
      const subRole = subRoleMatches[i];
      const subRoleStart = subRole.index;
      const nextSubRole = i < subRoleMatches.length - 1 
        ? subRoleMatches[i + 1].index
        : entry.length;
      
      const subRoleContent = entry.substring(subRoleStart, nextSubRole);
      const subDescriptions = [];
      
      // Extract bullets for this sub-role (indented with 2 spaces)
      const subBullets = subRoleContent.match(/^  -  [^\n]+/gm) || subRoleContent.match(/^-  [^\n]+/gm);
      if (subBullets) {
        subDescriptions.push(...subBullets.map(bullet => {
          return bullet.replace(/^[\s-]+/, '').replace(/\*\*/g, '').trim();
        }));
      }

      if (subDescriptions.length > 0) {
        subRoles.push({
          title: subRole.title,
          descriptions: subDescriptions,
        });
      }
    }

    experiences.push({
      company,
      position,
      location,
      period: dateRange,
      descriptions,
      subRoles: subRoles.length > 0 ? subRoles : undefined,
    });
  }

  return experiences;
}

// Extract education
function extractEducation(md) {
  const education = [];

  // Find EDUCATION section
  const educationSection = md.match(/# EDUCATION\s*([\s\S]*?)$/);
  if (!educationSection) {
    return education;
  }

  const eduText = educationSection[1];

  // Extract institution and date - pattern: **Institution** **Date**
  const institutionMatch = eduText.match(/\*\*([^*]+)\*\*\s+\*\*([^*]+)\*\*/);
  if (institutionMatch) {
    const institution = institutionMatch[1].trim();
    const dateRange = institutionMatch[2].trim().replace(/--/g, '-');

    // Extract degree and grade - pattern: *Bachelor of Technology - **Grade** - **71%*** *Delhi, India*
    const degreeMatches = eduText.match(/\*([^*]+)\*/g);
    if (degreeMatches && degreeMatches.length >= 2) {
      const degreeLine = degreeMatches[0].replace(/\*/g, '');
      const locationLine = degreeMatches[1].replace(/\*/g, '');
      
      // Extract grade
      const gradeMatch = degreeLine.match(/\*\*Grade\*\*\s*-\s*\*\*([^*]+)\*\*/);
      const grade = gradeMatch ? gradeMatch[1] : undefined;
      
      // Extract degree (remove grade part)
      const degree = degreeLine
        .replace(/\*\*Grade\*\*\s*-\s*\*\*[^*]+\*\*/g, '')
        .replace(/\s*-\s*$/, '')
        .trim();

      education.push({
        institution,
        degree,
        grade,
        location: locationLine.trim(),
        period: dateRange,
      });
    }
  }

  return education;
}

// Parse the markdown
const personalInfo = extractPersonalInfo(markdown);
const skills = extractSkills(markdown);
const experience = extractExperience(markdown);
const education = extractEducation(markdown);

// Generate TypeScript file
const tsContent = `// Auto-generated from out.md - Do not edit manually
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

export const personalInfo: PersonalInfo = ${JSON.stringify(personalInfo, null, 2)};

export const skillCategories: SkillCategory[] = [
  {
    name: "Languages",
    skills: ${JSON.stringify(skills.languages)},
  },
  {
    name: "Frontend",
    skills: ${JSON.stringify(skills.frontend)},
  },
  {
    name: "Backend",
    skills: ${JSON.stringify(skills.backend)},
  },
  {
    name: "Build, Tooling & DevOps",
    skills: ${JSON.stringify(skills.buildTools)},
  },
  {
    name: "Database",
    skills: ${JSON.stringify(skills.database)},
  },
];

export const experiences: Experience[] = ${JSON.stringify(experience, null, 2)};

export const education: EducationEntry[] = ${JSON.stringify(education, null, 2)};

// Helper: Get all skills as flat array for SkillsShowcase
export const allSkills = skillCategories.flatMap(cat => 
  cat.skills.map(skill => ({ name: skill, category: cat.name }))
);

// Helper: Get social links
export const socialLinks = [
  {
    name: "GitHub",
    href: \`https://github.com/\${personalInfo.github}\`,
  },
  {
    name: "LinkedIn",
    href: \`https://linkedin.com/in/\${personalInfo.linkedin}\`,
  },
  {
    name: "LeetCode",
    href: \`https://leetcode.com/u/\${personalInfo.leetcode}\`,
  },
  {
    name: "Email",
    href: \`mailto:\${personalInfo.email}\`,
  },
];
`;

// Ensure data directory exists
const dataDir = resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write the file
fs.writeFileSync(outputPath, tsContent, 'utf-8');

console.log('✅ Successfully parsed resume data!');
console.log(`📄 Output written to: ${outputPath}`);
console.log(`\n📊 Extracted:`);
console.log(`   - Personal Info: ${personalInfo.name}`);
console.log(`   - Skills: ${Object.keys(skills).length} categories`);
console.log(`   - Experience: ${experience.length} positions`);
console.log(`   - Education: ${education.length} entries`);

import { ResumeData } from "@/types";
import fs from "fs";
import path from "path";

/**
 * LaTeX Resume Parser
 * 
 * This parser extracts structured data from LaTeX resume files.
 * It handles common LaTeX resume structures and commands.
 */

interface ParseOptions {
  texFilePath: string;
  outputPath?: string;
}

/**
 * Removes LaTeX commands and formatting, leaving clean text
 */
function cleanLatexText(text: string): string {
  if (!text) return "";
  
  return text
    // Remove LaTeX commands with nested braces (e.g., \textbf{text}, \underline{text})
    .replace(/\\[a-zA-Z]+\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, "$1")
    // Remove remaining LaTeX commands without braces
    .replace(/\\[a-zA-Z]+\*/g, "")
    .replace(/\\[a-zA-Z]+/g, "")
    // Remove remaining backslashes
    .replace(/\\/g, "")
    // Remove curly braces (but preserve content)
    .replace(/\{|\}/g, "")
    // Clean up LaTeX artifacts like "textbf", "normalsize", etc.
    .replace(/\b(textbf|textit|emph|normalsize|large|small|underline|vspace|hspace)\b/gi, "")
    // Remove LaTeX spacing commands
    .replace(/\\[,\s]+/g, " ")
    // Clean up multiple spaces
    .replace(/\s+/g, " ")
    // Remove special LaTeX characters (but keep useful ones)
    .replace(/[&%$#]/g, "")
    // Clean up common LaTeX artifacts
    .replace(/\b(itemize|SubHeadingListStart|SubHeadingListEnd|resumeItemListStart|resumeItemListEnd)\b/gi, "")
    // Remove leading/trailing punctuation artifacts
    .replace(/^[,\s\-\.]+|[,\s\-\.]+$/g, "")
    // Trim whitespace
    .trim();
}

/**
 * Extracts content from LaTeX command
 */
function extractCommand(content: string, command: string): string | null {
  const regex = new RegExp(`\\\\${command}\\{([^}]+)\\}`, "i");
  const match = content.match(regex);
  return match ? cleanLatexText(match[1]) : null;
}

/**
 * Extracts content from LaTeX environment
 */
function extractEnvironment(content: string, envName: string): string[] {
  const regex = new RegExp(
    `\\\\begin\\{${envName}\\}([\\s\\S]*?)\\\\end\\{${envName}\\}`,
    "gi"
  );
  const matches = content.match(regex);
  if (!matches) return [];

  return matches.map((match) => {
    // Remove begin/end tags
    let cleaned = match
      .replace(new RegExp(`\\\\begin\\{${envName}\\}`, "gi"), "")
      .replace(new RegExp(`\\\\end\\{${envName}\\}`, "gi"), "");
    return cleanLatexText(cleaned);
  });
}

/**
 * Extracts personal information from LaTeX resume
 */
function parsePersonalInfo(content: string): ResumeData["personalInfo"] {
  // Try to extract name (common patterns: \name{}, \author{}, \fullname{})
  const name =
    extractCommand(content, "name") ||
    extractCommand(content, "author") ||
    extractCommand(content, "fullname") ||
    "Gopal Sharma";

  // Extract title/position
  const title =
    extractCommand(content, "title") ||
    extractCommand(content, "position") ||
    extractCommand(content, "jobtitle") ||
    "Team Lead (Software Engineering) & Full-Stack Developer";

  // Extract email
  const email =
    extractCommand(content, "email") ||
    content.match(/\\href\{mailto:([^}]+)\}/)?.[1] ||
    content.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] ||
    "connect2gopu@gmail.com";

  // Extract phone - handle \href{tel:...} format
  const phone =
    extractCommand(content, "phone") ||
    extractCommand(content, "mobile") ||
    content.match(/\\href\{tel:([^}]+)\}/)?.[1] ||
    content.match(/\\href\{tel:([^}]+)\}[^}]*\\underline\{([^}]+)\}/)?.[2] ||
    content.match(/(\+?[\d\s\-()]{10,})/)?.[1]?.trim() ||
    "+91-9069367364";

  // Extract summary/objective (common in \summary{} or \objective{})
  const summary =
    extractCommand(content, "summary") ||
    extractCommand(content, "objective") ||
    extractCommand(content, "about") ||
    "A passionate software engineer with 7+ years of experience building scalable web applications, leading cross-functional teams, and delivering high-impact product features that enhance user experience and drive business growth.";

  // Extract years of experience if mentioned
  const yearsMatch = summary.match(/(\d+)\+?\s*years?/i);
  const yearsOfExperience = yearsMatch ? yearsMatch[1] : undefined;

  // Format phone number nicely
  let formattedPhone = cleanLatexText(phone);
  // Format phone: +919069367364 -> +91-9069367364
  if (formattedPhone && /^\+91\d{10}$/.test(formattedPhone.replace(/\s/g, ""))) {
    formattedPhone = formattedPhone.replace(/^\+91(\d{10})$/, "+91-$1");
  }

  return {
    name: cleanLatexText(name),
    title: cleanLatexText(title).replace(/\s+/g, " "), // Fix double spaces
    email: cleanLatexText(email),
    phone: formattedPhone,
    summary: cleanLatexText(summary),
    yearsOfExperience,
  };
}

/**
 * Extracts work experience from LaTeX resume
 * Handles custom resume commands like \resumeSubheading and \resumeItem
 */
function parseExperiences(content: string): ResumeData["experiences"] {
  const experiences: ResumeData["experiences"] = [];

  // Try to find experience section (common patterns)
  // Make it more specific to match EXPERIENCE section exactly
  const experienceSection = content.match(
    /\\section\{EXPERIENCE\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i
  )?.[1];
  
  // If not found, try other variations
  if (!experienceSection) {
    const altMatch = content.match(
      /\\section\{.*?(?:Experience|Work|Employment|Professional).*?\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i
    );
    if (altMatch) {
      return parseExperiences(content.replace(altMatch[0], "")); // Try with remaining content
    }
  }

  if (!experienceSection) {
    console.warn("Experience section not found in LaTeX file");
    return experiences;
  }

  // Debug: Check if resumeSubheading exists
  if (!experienceSection.includes("\\resumeSubheading")) {
    console.warn("\\resumeSubheading not found in experience section");
    console.warn("First 500 chars:", experienceSection.substring(0, 500));
    return experiences;
  }

  // Split the section into blocks separated by \resumeSubheading
  // Each block represents one company/position
  // Handle multi-line \resumeSubheading commands
  const blocks = experienceSection.split(/(?=\\resumeSubheading)/);

  for (const block of blocks) {
    if (!block.trim() || !block.includes("\\resumeSubheading")) continue;

    // Simple approach: find \resumeSubheading and extract arguments manually
    // This avoids regex catastrophic backtracking
    const extractArg = (text: string, start: number): { content: string; end: number } | null => {
      while (start < text.length && /\s/.test(text[start])) start++;
      if (start >= text.length || text[start] !== '{') return null;
      let depth = 0;
      let i = start;
      const maxLen = Math.min(text.length, start + 500); // Limit to prevent infinite loops
      while (i < maxLen) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') {
          depth--;
          if (depth === 0) {
            return { content: text.substring(start + 1, i), end: i + 1 };
          }
        }
        i++;
      }
      return null;
    };
    
    const subheadingPos = block.indexOf('\\resumeSubheading');
    if (subheadingPos === -1) continue;
    
    // Find the four arguments by looking for balanced braces
    let pos = subheadingPos + '\\resumeSubheading'.length;
    
    const arg1 = extractArg(block, pos);
    if (!arg1) continue;
    const arg2 = extractArg(block, arg1.end);
    if (!arg2) continue;
    const arg3 = extractArg(block, arg2.end);
    if (!arg3) continue;
    const arg4 = extractArg(block, arg3.end);
    if (!arg4) continue;

    const company = cleanLatexText(arg1.content);
    const period = cleanLatexText(arg2.content);
    let role = cleanLatexText(arg3.content);
    const location = cleanLatexText(arg4.content);
    
    role = role.replace(/\\underline\{([^}]+)\}/g, "$1");

    // Extract resumeItem entries - use a simple approach
    const items: string[] = [];
    let itemPos = 0;
    while (itemPos < block.length) {
      const itemStart = block.indexOf('\\resumeItem{', itemPos);
      if (itemStart === -1) break;
      const braceStart = itemStart + '\\resumeItem{'.length - 1;
      const itemArg = extractArg(block, braceStart);
      if (itemArg) {
        items.push(cleanLatexText(itemArg.content));
        itemPos = itemArg.end;
      } else {
        itemPos = braceStart + 1;
      }
    }

    // If we found items, create an experience entry
    if (items.length > 0) {
      // Clean up description - remove "About the role" artifacts and join properly
      let description = items
        .filter(item => !item.toLowerCase().includes("about the role"))
        .join(". ")
        .replace(/\.\s*\./g, ".") // Fix double periods
        .trim();
      
      experiences.push({
        company,
        role,
        period,
        description: description || items.join(" "),
      });
    }

    // Check for sub-roles in the same block (like Lead Engineer, Senior Software Engineer)
    // Pattern: {\textit{\normalsize{\underline{Role Name}}}}
    // Use matchAll instead of exec to avoid potential infinite loops
    const subRoleRegex = /\{\\textit\{[^}]*\\normalsize\{[^}]*\\underline\{([^}]+)\}[^}]*\}[^}]*\}\}/g;
    const subRoleMatches = Array.from(block.matchAll(subRoleRegex));

    // Process each sub-role
    for (const subRoleMatch of subRoleMatches) {
      const subRole = cleanLatexText(subRoleMatch[1]);
      
      // Find the section after this sub-role
      const subRoleStart = subRoleMatch.index + subRoleMatch[0].length;
      const nextSubRole = block.substring(subRoleStart).match(subRoleRegex);
      const nextSubHeading = block.substring(subRoleStart).match(/\\resumeSubheading/);
      const nextResumeSubHeadingListEnd = block.substring(subRoleStart).match(/\\resumeSubHeadingListEnd/);
      
      let sectionEnd = block.length;
      if (nextSubHeading) {
        sectionEnd = subRoleStart + nextSubHeading.index;
      } else if (nextResumeSubHeadingListEnd) {
        sectionEnd = subRoleStart + nextResumeSubHeadingListEnd.index;
      } else if (nextSubRole) {
        sectionEnd = subRoleStart + nextSubRole.index;
      }

      const subRoleSection = block.substring(subRoleStart, sectionEnd);

      // Extract resumeItem entries for this sub-role
      const subRoleItems: string[] = [];
      let subItemPos = 0;
      while (subItemPos < subRoleSection.length) {
        const subItemStart = subRoleSection.indexOf('\\resumeItem{', subItemPos);
        if (subItemStart === -1) break;
        const subBraceStart = subItemStart + '\\resumeItem{'.length - 1;
        const subItemArg = extractArg(subRoleSection, subBraceStart);
        if (subItemArg) {
          subRoleItems.push(cleanLatexText(subItemArg.content));
          subItemPos = subItemArg.end;
        } else {
          subItemPos = subBraceStart + 1;
        }
      }

      if (subRoleItems.length > 0) {
        // Clean up description
        let subDescription = subRoleItems
          .filter(item => !item.toLowerCase().includes("about the role"))
          .join(". ")
          .replace(/\.\s*\./g, ".")
          .trim();
        
        experiences.push({
          company, // Same company as the main role
          role: subRole,
          period, // Same period as the main role
          description: subDescription || subRoleItems.join(" "),
        });
      }
    }
  }

  return experiences;
}

/**
 * Extracts education from LaTeX resume
 */
function parseEducation(content: string): ResumeData["education"] {
  const education: ResumeData["education"] = [];

  // Try to find education section
  const educationSection = content.match(
    /\\section\{.*?(?:Education|Academic).*?\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i
  )?.[1];

  if (!educationSection) return education;

  // Split by items
  const items = educationSection.split(/(?:\\item|\\begin\{itemize\})/);

  for (const item of items) {
    if (!item.trim() || item.length < 10) continue;

    // Extract degree
    const degreeMatch =
      item.match(/\\textbf\{([^}]+)\}/) ||
      item.match(/^([A-Z][^\\]+)/);
    const degree = degreeMatch ? cleanLatexText(degreeMatch[1]) : "";

    // Extract institution
    const institutionMatch = item.match(/([A-Z][^\\]+)/);
    const institution = institutionMatch
      ? cleanLatexText(institutionMatch[1])
      : "";

    // Extract grade
    const gradeMatch = item.match(/(?:Grade|GPA|Score)[:\s]+([^\\]+)/i);
    const grade = gradeMatch ? cleanLatexText(gradeMatch[1]) : undefined;

    // Extract period
    const periodMatch = item.match(/(\d{4}\s*[-–—]\s*\d{4})/);
    const period = periodMatch ? cleanLatexText(periodMatch[1]) : "";

    // Extract location
    const locationMatch = item.match(/([A-Z][a-z]+,\s*[A-Z][a-z]+)/);
    const location = locationMatch ? cleanLatexText(locationMatch[1]) : undefined;

    if (degree && institution) {
      education.push({
        degree: cleanLatexText(degree),
        institution: cleanLatexText(institution),
        grade,
        period: cleanLatexText(period),
        location,
      });
    }
  }

  return education;
}

/**
 * Extracts skills from LaTeX resume
 */
function parseSkills(content: string): ResumeData["skills"] {
  const skills: ResumeData["skills"] = [];

  // Try to find skills section
  const skillsSection = content.match(
    /\\section\{.*?(?:Skills|Technical|Technologies|Expertise).*?\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i
  )?.[1];

  if (!skillsSection) return skills;

  // Common skill categories
  const categoryPatterns = [
    /(?:Languages?|Programming)/i,
    /(?:Frontend|Front[- ]end)/i,
    /(?:Backend|Back[- ]end)/i,
    /(?:Tools?|DevOps|Build)/i,
    /(?:Database|Databases)/i,
    /(?:Framework|Frameworks)/i,
  ];

  // Split by subsections or items
  const parts = skillsSection.split(/(?:\\subsection|\\item)/);

  for (const part of parts) {
    if (!part.trim()) continue;

    // Try to identify category
    let category = "Other";
    for (const pattern of categoryPatterns) {
      if (pattern.test(part)) {
        const match = part.match(/\{([^}]+)\}/);
        if (match) {
          category = cleanLatexText(match[1]);
          break;
        }
      }
    }

    // Extract skills (comma-separated or itemized)
    const skillMatches = part.matchAll(/\{([^}]+)\}/g);
    const skillList: string[] = [];

    for (const match of skillMatches) {
      const skill = cleanLatexText(match[1]);
      if (skill && skill.length > 1 && !skill.match(/^(Languages?|Frontend|Backend|Tools?|Database)/i)) {
        skillList.push(skill);
      }
    }

    if (skillList.length > 0) {
      skills.push({
        category,
        skills: skillList,
      });
    }
  }

  return skills;
}

/**
 * Main parser function
 */
export function parseLatexResume(options: ParseOptions): ResumeData {
  const { texFilePath, outputPath } = options;

  // Read LaTeX file
  const fullPath = path.resolve(process.cwd(), texFilePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`LaTeX file not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, "utf-8");

  // Parse all sections
  const resumeData: ResumeData = {
    personalInfo: parsePersonalInfo(content),
    experiences: parseExperiences(content),
    education: parseEducation(content),
    skills: parseSkills(content),
  };

  // Write output if path provided
  if (outputPath) {
    const outputFullPath = path.resolve(process.cwd(), outputPath);
    const outputDir = path.dirname(outputFullPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(
      outputFullPath,
      JSON.stringify(resumeData, null, 2),
      "utf-8"
    );
    console.log(`✅ Resume data parsed and saved to: ${outputPath}`);
  }

  return resumeData;
}

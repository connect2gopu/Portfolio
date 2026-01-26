/**
 * PDF Resume Parser
 * Extracts structured data from PDF resume including text and links
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Resume, ContactInfo, WorkExperience, Education, SkillCategory } from '../types/index';

// Dynamic import for pdfjs-dist to handle ES modules
let pdfjsLib: any;

async function loadPdfJs() {
  if (!pdfjsLib) {
    // Use legacy build for Node.js (uses .mjs extension)
    const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib = pdfjsModule;
    
    // Configure worker - use .mjs for legacy build
    const workerPath = path.join(
      process.cwd(),
      'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs'
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
  }
  return pdfjsLib;
}

interface ExtractedLink {
  text: string;
  url: string;
  page: number;
}

interface TextBlock {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontName: string;
  page: number;
}

/**
 * Parse PDF and extract text and links
 */
async function parsePDF(pdfPath: string): Promise<{
  text: string;
  links: ExtractedLink[];
  textBlocks: TextBlock[];
}> {
  const pdfjs = await loadPdfJs();
  const buffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  
  const textBlocks: TextBlock[] = [];
  const links: ExtractedLink[] = [];
  let fullText = '';

  // Process each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Extract text blocks with positioning
    const pageTextBlocks: TextBlock[] = [];
    let pageText = '';
    
    for (const item of textContent.items) {
      if ('str' in item) {
        const tx = item.transform;
        const x = tx[4];
        const y = viewport.height - tx[5];
        const fontSize = tx[0];
        const fontName = 'fontName' in item ? item.fontName : '';
        
        pageText += item.str + ' ';
        pageTextBlocks.push({
          text: item.str,
          x,
          y,
          fontSize,
          fontName,
          page: pageNum,
        });
      }
    }
    
    fullText += pageText + '\n\n';
    textBlocks.push(...pageTextBlocks);
    
    // Extract links
    const linkAnnotations = await page.getAnnotations();
    for (const annotation of linkAnnotations) {
      if (annotation.subtype === 'Link' && annotation.url) {
        links.push({
          text: annotation.url,
          url: annotation.url,
          page: pageNum,
        });
      }
    }
  }

  return { text: fullText.trim(), links, textBlocks };
}

/**
 * Extract email from text
 */
function extractEmail(text: string): string | undefined {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const match = text.match(emailRegex);
  return match ? match[0] : undefined;
}

/**
 * Extract phone number from text
 */
function extractPhone(text: string): string | undefined {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  const match = text.match(phoneRegex);
  return match ? match[0] : undefined;
}

/**
 * Extract links from text and link annotations
 */
function extractLinks(text: string, extractedLinks: ExtractedLink[]): ContactInfo {
  const contact: ContactInfo = {};
  
  // Extract URLs from text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const textUrls = text.match(urlRegex) || [];
  
  // Combine with extracted links
  const allLinks = [
    ...extractedLinks.map(l => l.url),
    ...textUrls,
  ];
  
  // Categorize links
  for (const url of allLinks) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('linkedin.com')) {
      contact.linkedin = url;
    } else if (lowerUrl.includes('github.com')) {
      contact.github = url;
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      contact.twitter = url;
    } else if (lowerUrl.includes('http') && !contact.website) {
      contact.website = url;
    }
  }
  
  return contact;
}

/**
 * Extract personal information
 */
function extractPersonalInfo(text: string, links: ExtractedLink[]): {
  name: string;
  title?: string;
  summary?: string;
  contact: ContactInfo;
} {
  // Clean up text - PDF extraction can have weird spacing
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  const lines = cleanedText.split(/\s{2,}|\n/).filter(line => line.trim());
  
  // First line typically contains name - extract just the name part
  const firstLine = lines[0] || '';
  // Name is usually before contact info (email, phone, etc.)
  const nameMatch = firstLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  const name = nameMatch ? nameMatch[1].trim() : (firstLine.split(/\s+/).slice(0, 2).join(' ') || 'Unknown');
  
  // Look for title in next few lines or after name
  let title: string | undefined;
  for (let i = 1; i < Math.min(5, lines.length); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('lead') || line.includes('engineer') || line.includes('developer') || 
        line.includes('manager') || line.includes('director')) {
      title = lines[i].trim();
      break;
    }
  }
  
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const linkInfo = extractLinks(text, links);
  
  const contact: ContactInfo = {
    ...(email && { email }),
    ...(phone && { phone }),
    ...linkInfo,
  };
  
  // Try to extract summary/bio (usually after contact info, before experience)
  let summary: string | undefined;
  const summaryKeywords = ['summary', 'about', 'bio', 'profile', 'overview'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (summaryKeywords.some(keyword => line.includes(keyword))) {
      // Extract next few lines as summary
      const summaryLines: string[] = [];
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j] && !lines[j].match(/^(experience|education|skills|work)/i)) {
          summaryLines.push(lines[j].trim());
        } else {
          break;
        }
      }
      summary = summaryLines.join(' ').trim();
      break;
    }
  }
  
  return { name, title, summary, contact };
}

/**
 * Extract work experience
 */
function extractWorkExperience(text: string): WorkExperience[] {
  const experiences: WorkExperience[] = [];
  
  // Look for EXPERIENCE section (case insensitive)
  const experienceMatch = text.match(/EXPERIENCE\s+(.+?)(?=EDUCATION|$)/is);
  if (!experienceMatch) {
    return experiences;
  }
  
  const experienceText = experienceMatch[1];
  
  // Split by company patterns - look for company names followed by dates
  // Pattern: Company Name   Date Range   Role
  const companyPattern = /([A-Z][^•\n]+?)\s+([A-Z][a-z]+\s+\d{4}\s*[-–]\s*(?:Present|Current|[A-Z][a-z]+\s+\d{4}))\s+([^•\n]+?)(?=\s+[A-Z][a-z]+\s+\d{4}|$)/g;
  
  let match;
  while ((match = companyPattern.exec(experienceText)) !== null) {
    const company = match[1].trim();
    const period = match[2].trim();
    const role = match[3].trim();
    
    // Extract description (bullet points after role)
    const afterMatch = experienceText.substring(match.index + match[0].length);
    const nextCompanyMatch = afterMatch.match(/^([A-Z][^•\n]+?)\s+[A-Z][a-z]+\s+\d{4}/);
    const descriptionEnd = nextCompanyMatch ? nextCompanyMatch.index : afterMatch.length;
    const descriptionText = afterMatch.substring(0, descriptionEnd);
    
    // Clean up description - remove extra whitespace, keep bullet points
    const description = descriptionText
      .replace(/\s+/g, ' ')
      .replace(/\s*•\s*/g, '\n• ')
      .trim();
    
    experiences.push({
      company,
      role,
      period,
      description: description || '',
    });
  }
  
  // Fallback: try simpler pattern if above didn't work
  if (experiences.length === 0) {
    // Look for patterns like "Company   Date   Role"
    const simplePattern = /([A-Z][^•\n]{10,60}?)\s+([A-Z][a-z]+\s+\d{4}\s*[-–]\s*(?:Present|Current|[A-Z][a-z]+\s+\d{4}))/g;
    const matches = [...experienceText.matchAll(simplePattern)];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const company = match[1].trim();
      const period = match[2].trim();
      
      // Try to find role in next few lines
      const afterText = experienceText.substring(match.index + match[0].length);
      const roleMatch = afterText.match(/^([^•\n]{5,60})/);
      const role = roleMatch ? roleMatch[1].trim() : 'Unknown Role';
      
      experiences.push({
        company,
        role,
        period,
        description: '',
      });
    }
  }
  
  return experiences.filter(exp => exp.company && exp.role);
}

/**
 * Extract education
 */
function extractEducation(text: string): Education[] {
  const education: Education[] = [];
  
  // Look for EDUCATION section
  const educationMatch = text.match(/EDUCATION\s+(.+?)(?=EXPERIENCE|SKILLS|$)/is);
  if (!educationMatch) {
    return education;
  }
  
  const educationText = educationMatch[1];
  
  // Pattern: Institution   Date Range   Degree   Grade
  const eduPattern = /([A-Z][^•\n]{10,80}?)\s+([A-Z][a-z]+\s+\d{4}\s*[–-]\s*[A-Z][a-z]+\s+\d{4})\s+([^•\n]+?)(?:\s*-\s*Grade\s*-\s*(\d+%))?/i;
  const match = educationText.match(eduPattern);
  
  if (match) {
    const institution = match[1].trim();
    const period = match[2].trim();
    const degree = match[3].trim();
    const grade = match[4] ? `${match[4]}%` : undefined;
    
    // Extract location if present
    const locationMatch = educationText.match(/([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)\s*$/);
    const location = locationMatch ? locationMatch[1] : undefined;
    
    education.push({
      degree,
      institution,
      period,
      grade,
      location,
    });
  }
  
  return education.filter(edu => edu.degree && edu.institution);
}

/**
 * Extract skills
 */
function extractSkills(text: string): SkillCategory[] {
  const skills: SkillCategory[] = [];
  
  // Look for TECHNICAL SKILLS or SKILLS section (case insensitive, flexible spacing)
  const skillsMatch = text.match(/(?:TECHNICAL\s+)?SKILLS\s+(.+?)(?=EXPERIENCE|EDUCATION|$)/is);
  if (!skillsMatch) {
    // Try alternative - skills might be before experience
    const altMatch = text.match(/SKILLS[:\s]+(.+?)(?=EXPERIENCE|EDUCATION|WORK|$)/is);
    if (!altMatch) {
      return skills;
    }
    const skillsText = altMatch[1];
    return parseSkillsText(skillsText);
  }
  
  const skillsText = skillsMatch[1];
  return parseSkillsText(skillsText);
}

function parseSkillsText(skillsText: string): SkillCategory[] {
  const skills: SkillCategory[] = [];
  
  // Extract categories - look for "Category:" pattern (case insensitive)
  // Pattern: CategoryName: skill1, skill2, skill3.
  const categoryPattern = /([A-Z][a-z\s&,]+?):\s*([^A-Z]+?)(?=[A-Z][a-z\s&]+:|$)/gi;
  let match;
  
  while ((match = categoryPattern.exec(skillsText)) !== null) {
    const categoryName = match[1].trim();
    const skillsListText = match[2];
    
    // Split skills by comma, period, or bullet
    const skillsList = skillsListText
      .split(/[,•·.]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 50)
      .map(s => s.replace(/\.$/, '').trim()) // Remove trailing periods
      .filter(s => s.length > 0);
    
    if (skillsList.length > 0) {
      skills.push({
        name: categoryName,
        skills: skillsList,
      });
    }
  }
  
  return skills;
}

/**
 * Main parsing function
 */
async function parseResume(pdfPath: string): Promise<Resume> {
  console.log(`Parsing PDF: ${pdfPath}`);
  
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }
  
  const { text, links } = await parsePDF(pdfPath);
  
  console.log(`Extracted ${text.length} characters and ${links.length} links`);
  
  const personalInfo = extractPersonalInfo(text, links);
  const workExperience = extractWorkExperience(text);
  const education = extractEducation(text);
  const skills = extractSkills(text);
  
  // Extract all links for the resume
  const allLinks = links.map(link => ({
    text: link.url,
    url: link.url,
  }));
  
  const resume: Resume = {
    personalInfo,
    workExperience,
    education,
    skills,
    links: allLinks,
    extractedAt: new Date().toISOString(),
    sourceFile: path.basename(pdfPath),
  };
  
  return resume;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const pdfPath = args[0] || path.join(process.cwd(), 'public/resume/Resume_Gopal_7_YOE.pdf');
  const outputPath = args[1] || path.join(process.cwd(), 'data/resume.json');
  
  try {
    const resume = await parseResume(pdfPath);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write JSON output
    fs.writeFileSync(outputPath, JSON.stringify(resume, null, 2));
    
    console.log(`\n✅ Resume parsed successfully!`);
    console.log(`📄 Output: ${outputPath}`);
    console.log(`\nExtracted:`);
    console.log(`  - Name: ${resume.personalInfo.name}`);
    console.log(`  - Title: ${resume.personalInfo.title || 'N/A'}`);
    console.log(`  - Work Experience: ${resume.workExperience.length} entries`);
    console.log(`  - Education: ${resume.education.length} entries`);
    console.log(`  - Skill Categories: ${resume.skills.length}`);
    console.log(`  - Links: ${resume.links?.length || 0}`);
  } catch (error) {
    console.error('❌ Error parsing resume:', error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch(console.error);

export { parseResume, parsePDF };

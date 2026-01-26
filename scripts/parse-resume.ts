#!/usr/bin/env node

/**
 * Resume Parser Script
 * 
 * Usage: npm run parse-resume [path-to-resume.tex]
 * 
 * This script parses a LaTeX resume file and generates structured JSON data
 * that can be used throughout the portfolio.
 */

import { parseLatexResume } from "../lib/resume-parser";
import path from "path";
import fs from "fs";

const DEFAULT_TEX_PATH = "public/resume/resume.tex";
const DEFAULT_OUTPUT_PATH = "lib/resume-data.json";

function main() {
  // Get LaTeX file path from command line or use default
  const texPath = process.argv[2] || DEFAULT_TEX_PATH;
  const outputPath = process.argv[3] || DEFAULT_OUTPUT_PATH;

  console.log("📄 Parsing LaTeX resume...");
  console.log(`   Input: ${texPath}`);
  console.log(`   Output: ${outputPath}`);

  try {
    const resumeData = parseLatexResume({
      texFilePath: texPath,
      outputPath,
    });

    // Print summary
    console.log("\n✅ Resume parsed successfully!");
    console.log(`   Name: ${resumeData.personalInfo.name}`);
    console.log(`   Title: ${resumeData.personalInfo.title}`);
    console.log(`   Experiences: ${resumeData.experiences.length}`);
    console.log(`   Education: ${resumeData.education.length}`);
    console.log(`   Skill Categories: ${resumeData.skills.length}`);

    // Validate data
    if (resumeData.experiences.length === 0) {
      console.warn("\n⚠️  Warning: No experiences found. You may need to adjust the parser.");
    }
    if (resumeData.education.length === 0) {
      console.warn("⚠️  Warning: No education found. You may need to adjust the parser.");
    }
    if (resumeData.skills.length === 0) {
      console.warn("⚠️  Warning: No skills found. You may need to adjust the parser.");
    }

    console.log("\n💡 Tip: Review the generated JSON file and adjust the parser if needed.");
  } catch (error) {
    console.error("\n❌ Error parsing resume:", error);
    process.exit(1);
  }
}

main();

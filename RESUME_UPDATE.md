# Resume Update Guide

This guide explains how to keep your portfolio up-to-date with your LaTeX resume.

## Overview

The portfolio automatically displays data from your resume. When you update your resume on Overleaf, you can sync it to your portfolio using a simple npm command.

## Setup

1. **Place your LaTeX resume file** in the project:
   ```bash
   # Create the directory if it doesn't exist
   mkdir -p content/resume
   
   # Copy your resume.tex file from Overleaf to:
   content/resume/resume.tex
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

## Updating Your Resume

When you update your resume on Overleaf:

1. **Download the updated files** from Overleaf:
   - Download `resume.tex` (LaTeX source)
   - Download `resume.pdf` (compiled PDF)

2. **Update the files in your project**:
   ```bash
   # Copy resume.tex to content/resume/resume.tex
   # Copy resume.pdf to public/resume/Resume_Gopal_7_YOE.pdf (or update the filename)
   ```

3. **Parse the resume** to update portfolio data:
   ```bash
   npm run parse-resume
   ```

   Or specify custom paths:
   ```bash
   npm run parse-resume content/resume/resume.tex lib/resume-data.json
   ```

4. **Verify the update**:
   - Check `lib/resume-data.json` to see the parsed data
   - Run `npm run dev` and visit your portfolio to see the changes

## How It Works

1. **Parser** (`lib/resume-parser.ts`): Extracts structured data from your LaTeX file
2. **Data File** (`lib/resume-data.json`): Stores the parsed resume data
3. **Loader** (`lib/resume.ts`): Provides functions to access resume data throughout the app
4. **Components**: Automatically use the parsed data instead of hardcoded values

## What Gets Extracted

The parser extracts:

- **Personal Information**: Name, title, email, phone, summary, years of experience
- **Work Experience**: Company, role, period, description
- **Education**: Degree, institution, grade, period, location
- **Skills**: Categorized skills list

## Customizing the Parser

If your LaTeX resume uses a different structure, you may need to adjust the parser in `lib/resume-parser.ts`. The parser handles common LaTeX resume patterns, but you can modify it to match your specific format.

### Common LaTeX Commands Supported

- `\name{}`, `\author{}`, `\fullname{}` - Name
- `\title{}`, `\position{}`, `\jobtitle{}` - Job title
- `\email{}` - Email
- `\phone{}`, `\mobile{}` - Phone
- `\summary{}`, `\objective{}`, `\about{}` - Summary
- `\section{Experience}` - Work experience section
- `\section{Education}` - Education section
- `\section{Skills}` - Skills section

## Troubleshooting

### Parser doesn't extract data correctly

1. Check that your LaTeX file is in the correct location
2. Review the generated `lib/resume-data.json` file
3. Adjust the parser functions in `lib/resume-parser.ts` to match your LaTeX structure
4. Common issues:
   - Different section names (e.g., "Work History" instead of "Experience")
   - Custom LaTeX commands not recognized
   - Nested environments not handled

### Data not showing on the site

1. Ensure `lib/resume-data.json` exists and is valid JSON
2. Check that the parser ran successfully (no errors in console)
3. Restart your dev server: `npm run dev`
4. The app falls back to default data if the file doesn't exist

### PDF not updating

Make sure to update the PDF file in `public/resume/` and update the filename in `components/about/ResumeDownload.tsx` if needed.

## File Structure

```
connect2gopu/
├── content/
│   └── resume/
│       └── resume.tex          # Your LaTeX source file
├── lib/
│   ├── resume-parser.ts        # LaTeX parser
│   ├── resume.ts               # Data loader
│   └── resume-data.json        # Generated parsed data (git-ignored)
├── public/
│   └── resume/
│       └── Resume_Gopal_7_YOE.pdf  # PDF for download
└── scripts/
    └── parse-resume.ts         # Parser script
```

## Best Practices

1. **Keep both .tex and .pdf files** in sync
2. **Run the parser** after every resume update
3. **Review the generated JSON** to ensure data is correct
4. **Commit the .tex file** to git (but not the generated JSON if it's git-ignored)
5. **Test locally** before deploying

## Example Workflow

```bash
# 1. Download updated resume from Overleaf
# 2. Copy files
cp ~/Downloads/resume.tex content/resume/resume.tex
cp ~/Downloads/resume.pdf public/resume/Resume_Gopal_7_YOE.pdf

# 3. Parse the resume
npm run parse-resume

# 4. Test locally
npm run dev

# 5. Commit changes
git add content/resume/resume.tex public/resume/Resume_Gopal_7_YOE.pdf
git commit -m "Update resume"
```

## Notes

- The parser is designed to handle common LaTeX resume templates
- You may need to customize it for your specific LaTeX structure
- The generated `resume-data.json` is used at build time, so you need to run the parser before building
- Consider adding `lib/resume-data.json` to `.gitignore` if you want to regenerate it on each deployment
